#!/usr/bin/env -S deno run --allow-net

import { readAll } from '@std/io'
import { completion, structured } from '../helpers/completion.ts'
import { safe } from '../helpers/safe.ts'

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

const extract = async (content: string, schema: Record<string, unknown>): Promise<string> => {
  return await structured({
    messages: [{
      role: 'system',
      content: [
        'Extract structured data from the input according to the JSON Schema.',
        'If a field cannot be determined, use null.',
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
  console.error('Usage: echo "content" | rd json \'{ name: string, age: number }\'')
  console.error('Schema: TypeScript type, example object, natural language, or JSON Schema')
  Deno.exit(1)
}

if (!stdin) {
  console.error('No input. Pipe content via stdin.')
  Deno.exit(1)
}

const schema: Record<string, unknown> = JSON.parse(await toSchema(schemaArg))
const raw: string = await extract(stdin, schema)

const { data: parsed, error } = safe(() => JSON.parse(raw))

if (error) {
  console.log(raw)
} else {
  console.log(JSON.stringify(parsed, null, 2))
}
