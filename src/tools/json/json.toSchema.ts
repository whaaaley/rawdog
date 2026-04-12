#!/usr/bin/env -S deno run --allow-net

import { completion } from '../../core/completion.ts'

const description: string = Deno.args.join(' ')

if (!description) {
  console.error("Usage: rd toSchema '{ name: string, age: number }'")
  console.error("       rd toSchema 'an object with day, time, and attendees array'")
  Deno.exit(1)
}

const raw: string = await completion({
  messages: [{
    role: 'system',
    content: [
      'Output a JSON Schema object from the description.',
      'The description may be TypeScript types, example objects, natural language, or raw JSON Schema.',
      'Compact, no whitespace.',
    ].join(' '),
  }, {
    role: 'user',
    content: description,
  }],
  temperature: 0.2,
  max_tokens: 2048,
})

console.log(raw)
