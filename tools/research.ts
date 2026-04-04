#!/usr/bin/env -S deno run --allow-net

import { z } from 'zod'
import { structured } from '../helpers/complete.ts'
import { ddgSearch } from '../helpers/ddg.ts'
import { fetchPage } from '../helpers/fetchPage.ts'
import { summarize } from '../helpers/summarize.ts'

const MAX_ITERATIONS = 5
const MAX_CANDIDATES = 3

const description = Deno.args.join(' ')

if (!description) {
  console.error('Usage: autoResearch <description>')
  Deno.exit(1)
}

// Step 1: Model generates a search query from the description
const querySchema = z.object({
  query: z.string().describe('A concise search engine query to research the topic'),
})

// Step 3: Model picks candidate URLs to fetch
const candidatesSchema = z.object({
  picks: z.array(z.object({
    index: z.number().describe('Index of the search result to fetch'),
    reason: z.string().describe('Why this result is likely useful'),
  })).describe('The most promising results to fetch, max 3'),
})

// Step 5: Model evaluates if we have enough info
const evaluateSchema = z.object({
  sufficient: z.boolean().describe('True if the gathered info can answer the question'),
  summary: z.string().describe('Brief summary of what we know so far'),
  next_query: z.string().optional().describe('A refined search query if not sufficient'),
})

const context: string[] = []
const visited = new Set<string>()

for (let i = 0; i < MAX_ITERATIONS; i++) {
  // Generate search query
  const queryMessages = [
    {
      role: 'system' as const,
      content: 'You generate concise search engine queries. No quotes, no operators, just natural search terms.',
    },
    ...context.length > 0
      ? [{
        role: 'user' as const,
        content: `Previous research so far:\n${context.join('\n\n')}\n\nThis was not enough. Generate a different, more specific search query.`,
      }]
      : [],
    {
      role: 'user' as const,
      content: `Research topic: ${description}`,
    },
  ]

  const queryResult = querySchema.parse(await structured({
    messages: queryMessages,
    schema: z.toJSONSchema(querySchema),
    temperature: 0.3,
    max_tokens: 256,
  }))

  console.log(`\n[search ${i + 1}/${MAX_ITERATIONS}] ${queryResult.query}`)

  // Search
  let results
  try {
    results = await ddgSearch(queryResult.query)
  } catch (err) {
    console.error(`Search failed: ${err}`)
    continue
  }

  if (results.length === 0) {
    console.log('No results found')
    continue
  }

  // Show results
  for (let j = 0; j < results.length; j++) {
    console.log(`  ${j}. ${results[j].title}`)
    console.log(`     ${results[j].url}`)
  }

  // Filter out already-visited URLs before picking
  const fresh = results.filter((r) => !visited.has(r.url))

  if (fresh.length === 0) {
    console.log('  All results already visited')
    continue
  }

  // Pick candidates
  const resultsText = fresh.map((r, j) => `${j}. ${r.title} — ${r.abstract}`).join('\n')

  const candidatesResult = candidatesSchema.parse(await structured({
    messages: [
      {
        role: 'system' as const,
        content: `You pick the most relevant search results to fetch. Pick at most ${MAX_CANDIDATES}. Only pick results that are likely to contain useful information for the research topic.`,
      },
      {
        role: 'user' as const,
        content: `Research topic: ${description}\n\nSearch results:\n${resultsText}`,
      },
    ],
    schema: z.toJSONSchema(candidatesSchema),
    temperature: 0.1,
    max_tokens: 512,
  }))

  // Fetch candidates
  const pages: string[] = []

  for (const pick of candidatesResult.picks) {
    const result = fresh[pick.index]
    if (!result) continue

    visited.add(result.url)
    console.log(`  -> fetching: ${result.title}`)

    try {
      const text = await fetchPage(result.url)
      pages.push(`# ${result.title}\nURL: ${result.url}\n\n${text}`)
    } catch (err) {
      console.log(`     failed: ${err}`)
    }
  }

  if (pages.length === 0) {
    console.log('All fetches failed')
    continue
  }

  context.push(...pages)

  // Evaluate
  const evalResult = evaluateSchema.parse(await structured({
    messages: [
      {
        role: 'system' as const,
        content: 'You evaluate whether the gathered information is sufficient to answer the research topic. Mark sufficient as true if you can give a solid, useful answer — it does not need to be exhaustive. Only continue searching if critical information is clearly missing.',
      },
      {
        role: 'user' as const,
        content: `Research topic: ${description}\n\nGathered information:\n${context.join('\n\n---\n\n')}`,
      },
    ],
    schema: z.toJSONSchema(evaluateSchema),
    temperature: 0.2,
    max_tokens: 2048,
  }))

  if (evalResult.sufficient) {
    console.log('\n--- answer ---\n')
    await summarize(description, context)
    Deno.exit(0)
  }

  console.log(`\n  [not enough] ${evalResult.summary}\n`)
}

// Ran out of iterations — give best-effort answer
console.log('\n[max iterations reached, synthesizing best-effort answer]\n')
await summarize(description, context)
