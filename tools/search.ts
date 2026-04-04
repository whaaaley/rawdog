#!/usr/bin/env -S deno run --allow-net

import { ddgSearch } from '../helpers/ddg.ts'

const query = Deno.args.join(' ')

if (!query) {
  console.error('Usage: autoSearch <query>')
  Deno.exit(1)
}

const results = await ddgSearch(query)

for (const r of results) {
  console.log(`${r.title}`)
  console.log(`  ${r.url}`)
  console.log(`  ${r.abstract}`)
  console.log()
}
