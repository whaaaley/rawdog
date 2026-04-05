#!/usr/bin/env -S deno run --allow-net

import { z } from 'zod'
import { readAll } from '@std/io'
import { completion } from '../../core/completion.ts'

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

const extract = async (schema: string, content: string): Promise<string> => {
  return await completion({
    messages: [{
      role: 'system',
      content: [
        'Extract structured data from the input as JSON matching the schema.',
        'Null for undetermined fields.',
        'Compact, no whitespace.',
      ].join(' '),
    }, {
      role: 'user',
      content: `Schema: ${schema}\n---\n${content}`,
    }],
    temperature: 0,
    max_tokens: 4096,
  })
}

const schemaArg: string = Deno.args.join(' ')
const stdin: string = Deno.stdin.isTerminal() ? '' : new TextDecoder().decode(await readAll(Deno.stdin))

if (!schemaArg) {
  console.error('Usage: echo "content" | rd json \'{ name: string, age: number }\'')
  console.error('Schema: TypeScript type, example object, natural language, or JSON Schema')
  Deno.exit(1)
}

if (!stdin) {
  console.error('No input. Pipe content via stdin.')
  Deno.exit(1)
}

const schemaRaw: string = await toSchema(schemaArg)
const raw: string = await extract(schemaRaw, stdin)

const validator = z.fromJSONSchema(JSON.parse(schemaRaw))
const result = validator.safeParse(JSON.parse(raw))

if (!result.success) {
  console.error('validation failed:')
  result.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  })
}

console.log(raw)
