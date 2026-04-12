#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { parseArgs } from '@std/cli'
import { ddgSearch, PAGE_SIZE } from './search.ddg.ts'
import { formatResults } from './search.format.ts'
import { renderSearchResult } from './search.render.ts'

const args = parseArgs(Deno.args, {
  string: ['page'],
  alias: { p: 'page' },
})

const query = args._.join(' ')

if (!query) {
  console.error('Usage: rd search <query> [--page N]')
  Deno.exit(1)
}

const page = args.page ? Number(args.page) : undefined

if (page !== undefined && (isNaN(page) || page < 1)) {
  console.error('--page must be a positive number')
  Deno.exit(1)
}

const { results, offset } = await ddgSearch(String(query), page)

const output = formatResults({
  label: 'DuckDuckGo results',
  items: results,
  total: offset + results.length,
  limit: PAGE_SIZE,
  offset,
  renderItem: renderSearchResult,
})

console.log(output)
