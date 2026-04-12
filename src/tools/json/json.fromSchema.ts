#!/usr/bin/env -S deno run --allow-net

import { readAll } from '@std/io'
import { completion } from '../../core/completion.ts'
import { type JsonObject, jsonObjectSchema } from './json.schema.ts'

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

const schema: JsonObject = jsonObjectSchema.parse(JSON.parse(schemaArg))

const raw: string = await completion({
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
  response_format: {
    type: 'json_object',
    schema,
  },
  temperature: 0.2,
  max_tokens: 4096,
})

console.log(raw)
