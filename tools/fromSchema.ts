#!/usr/bin/env -S deno run --allow-net

import { readAll } from '@std/io'
import { structured } from '../helpers/completion.ts'

const schemaArg: string = Deno.args.join(' ')
const stdin: string = Deno.stdin.isTerminal() ? '' : new TextDecoder().decode(await readAll(Deno.stdin))

if (!schemaArg) {
  console.error('Usage: echo "content" | rd fromSchema \'{"type":"object","properties":{...}}\'')
  console.error('Schema must be a valid JSON Schema object.')
  Deno.exit(1)
}

if (!stdin) {
  console.error('No input. Pipe content via stdin.')
  Deno.exit(1)
}

const schema: Record<string, unknown> = JSON.parse(schemaArg)

const raw: string = await structured({
  messages: [{
    role: 'system',
    content: [
      'Extract structured data from the input.',
      'Null for undetermined fields.',
    ].join(' '),
  }, {
    role: 'user',
    content: stdin,
  }],
  schema,
  temperature: 0,
  max_tokens: 4096,
})

console.log(raw)
