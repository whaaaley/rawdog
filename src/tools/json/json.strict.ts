#!/usr/bin/env -S deno run --allow-net

import { readAll } from '@std/io'
import { completion, structured } from '../../core/completion.ts'
import { jsonObjectSchema, type JsonObject } from './json.schema.ts'

const toSchema = async (description: string): Promise<string> => {
  return await completion({
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
    temperature: 0,
    max_tokens: 2048,
  })
}

const extract = async (content: string, schema: JsonObject): Promise<string> => {
  return await structured({
    messages: [{
      role: 'system',
      content: [
        'Extract structured data from the input.',
        'Null for undetermined fields.',
      ].join(' '),
    }, {
      role: 'user',
      content,
    }],
    schema,
    temperature: 0,
    max_tokens: 4096,
  })
}

const schemaArg: string = Deno.args.join(' ')
const stdin: string = Deno.stdin.isTerminal() ? '' : new TextDecoder().decode(await readAll(Deno.stdin))

if (!schemaArg) {
  console.error('Usage: echo "content" | rd jsonStrict \'{ name: string, age: number }\'')
  console.error('Schema: TypeScript type, example object, natural language, or JSON Schema')
  Deno.exit(1)
}

if (!stdin) {
  console.error('No input. Pipe content via stdin.')
  Deno.exit(1)
}

const schema: JsonObject = jsonObjectSchema.parse(JSON.parse(await toSchema(schemaArg)))
const raw: string = await extract(stdin, schema)

console.log(raw)
