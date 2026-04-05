#!/usr/bin/env -S deno run --allow-net

import { z } from 'zod'
import { structured } from '../../core/completion.ts'
import { safeAsync } from '../../utils/safe.utils.ts'
import { ddgSearch } from '../search/search.ddg.ts'
import { searchResultSchema } from '../search/search.schema.ts'
import type { SearchResult } from '../search/search.schema.ts'
import { fetchPage } from './research.fetch.ts'
import { summarize } from './research.summarize.ts'
import { candidatesSchema, querySchema } from './research.schema.ts'
import { tracker } from './research.tracker.ts'

const MAX_ITERATIONS: number = 3

const description: string = Deno.args.join(' ')
if (!description) {
  console.error('Usage: rd research <description>')
  Deno.exit(1)
}

const generateQuery = async (topic: string, previousQueries: string[]): Promise<string> => {
  const result = querySchema.parse(JSON.parse(
    await structured({
      messages: [{
        role: 'system',
        content: [
          'Generate a search query that explores a different angle of the topic.',
          'Do not reuse or rearrange words from previous queries.',
          'Focus on related subtopics, underlying concepts, or adjacent terminology.',
        ].join(' '),
      }, {
        role: 'user',
        content: `Topic: ${topic}\n\nDo not repeat these:\n${previousQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
      }],
      schema: z.toJSONSchema(querySchema),
      temperature: 0.7,
      max_tokens: 128,
    }),
  ))

  return result.query
}

const search = async (query: string, visited: Set<string>): Promise<SearchResult[]> => {
  const results: SearchResult[] = await ddgSearch(query)

  results.forEach((result, i) => {
    console.error(`  ${i}. ${result.title}`)
    console.error(`     ${result.url}`)
  })

  return results.filter((r) => !visited.has(r.url))
}

const pickCandidates = async (topic: string, results: SearchResult[]): Promise<SearchResult[]> => {
  const resultsText: string = results.map((r, i) => `${i}. ${r.title} — ${r.abstract}`).join('\n')

  const result = candidatesSchema.parse(JSON.parse(
    await structured({
      messages: [{
        role: 'system',
        content: 'Pick the most relevant search results for the research topic.',
      }, {
        role: 'user',
        content: `Research topic: ${topic}\n\nSearch results:\n${resultsText}`,
      }],
      schema: z.toJSONSchema(candidatesSchema),
      temperature: 0.1,
      max_tokens: 128,
    }),
  ))

  return result.indices
    .map((i) => searchResultSchema.safeParse(results[i]))
    .filter((r) => r.success)
    .map((r) => r.data)
}

const fetchPages = async (results: SearchResult[], visited: Set<string>): Promise<string[]> => {
  results.forEach((r) => visited.add(r.url))

  const lines = tracker(results.map((r) => r.title))

  const promises = results.map(async (result, i) => {
    const { data, error } = await safeAsync(() => fetchPage(result.url))

    if (error) {
      lines.fail(i)
      return null
    }

    if (!data.text) {
      lines.empty(i)
      return null
    }

    lines.done(i, data.status)
    return `# ${result.title}\nURL: ${result.url}\n\n${data.text}`
  })

  const fetched = await Promise.all(promises)
  return fetched
    .map((p) => z.string().safeParse(p))
    .filter((r) => r.success)
    .map((r) => r.data)
}

const research = (topic: string): Promise<string[]> => {
  const context: string[] = []
  const queries: string[] = []
  const visited: Set<string> = new Set()

  const loop = async (iteration: number): Promise<string[]> => {
    if (iteration >= MAX_ITERATIONS) {
      return context
    }

    const query: string = await generateQuery(topic, queries)
    queries.push(query)
    console.error(`\n[search ${iteration + 1}/${MAX_ITERATIONS}] ${query}`)

    const fresh: SearchResult[] = await search(query, visited)
    if (fresh.length === 0) {
      console.error('  No fresh results')
      return loop(iteration + 1)
    }

    console.error()

    const candidates: SearchResult[] = await pickCandidates(topic, fresh)
    const pages: string[] = await fetchPages(candidates, visited)

    if (pages.length === 0) {
      console.error('All fetches failed')
      return loop(iteration + 1)
    }

    context.push(...pages)
    return loop(iteration + 1)
  }

  return loop(0)
}

const context: string[] = await research(description)
console.error('\n--- answer ---\n')
await summarize(description, context)
