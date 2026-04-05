#!/usr/bin/env -S deno run --allow-net

import { z } from 'zod'
import { readAll } from '@std/io'
import { completion } from '../helpers/completion.ts'

const toSchema = async (description: string): Promise<string> => {
  return await completion({
    messages: [{
      role: 'system',
      content: [
        'Convert the schema description into a valid JSON Schema object.',
        'Accept TypeScript types, example objects, natural language, or raw JSON Schema.',
        'Output ONLY the JSON Schema object. No markdown, no explanation.',
      ].join(' '),
    }, {
      role: 'user',
      content: description,
    }],
    temperature: 0,
    max_tokens: 2048,
  })
}

const extract = async (description: string, content: string): Promise<string> => {
  return await completion({
    messages: [{
      role: 'system',
      content: [
        'Extract structured data from the input.',
        'The user provides a schema description and content separated by ---.',
        'Output ONLY valid JSON matching the described schema.',
        'No markdown, no explanation, no fences.',
      ].join(' '),
    }, {
      role: 'user',
      content: `Schema: ${description}\n---\n${content}`,
    }],
    temperature: 0,
    max_tokens: 4096,
  })
}

const schemaArg: string = Deno.args.join(' ')
const stdin: string = Deno.stdin.isTerminal() ? '' : new TextDecoder().decode(await readAll(Deno.stdin))

if (!schemaArg) {
  console.error('Usage: echo "content" | rd jsonfast \'{ name: string, age: number }\'')
  console.error('Schema: TypeScript type, example object, natural language, or JSON Schema')
  Deno.exit(1)
}

if (!stdin) {
  console.error('No input. Pipe content via stdin.')
  Deno.exit(1)
}

const [schemaRaw, raw]: [string, string] = await Promise.all([
  toSchema(schemaArg),
  extract(schemaArg, stdin),
])

const parsed: unknown = JSON.parse(raw)
const validator = z.fromJSONSchema(JSON.parse(schemaRaw))
const result = validator.safeParse(parsed)

if (!result.success) {
  console.error('validation failed:')
  result.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  })
  console.log(JSON.stringify(parsed, null, 2))
} else {
  console.log(JSON.stringify(result.data, null, 2))
}
