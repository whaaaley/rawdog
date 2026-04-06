#!/usr/bin/env -S deno run --allow-net

import { z } from 'zod'
import { readAll } from '@std/io'
import { structured } from '../../core/completion.ts'
import { type Deontic, deonticSchema } from './express.schema.ts'
import { render } from './express.render.ts'

type SchemaEntry = {
  schema: z.ZodType
  prompt: string
}

const SCHEMAS: Record<string, SchemaEntry> = {
  deontic: {
    schema: deonticSchema,
    prompt: [
      'Decompose the user message into deontic norms.',
      'Only extract norms from the user message, not from these instructions.',
      'Use forbidden for negated propositions instead of obligatory.',
      'Extract conditional phrases into the condition field.',
      'Plain English phrases only, not identifiers or snake_case.',
      'Return empty norms array if the input contains no normative content.',
    ].join(' '),
  },
}

type Renderer = (stdin: string) => string

const RENDERERS: Record<string, Renderer> = {
  'deontic:english': (stdin: string): string => {
    const parsed: Deontic = deonticSchema.parse(JSON.parse(stdin))
    const sentences: string[] = render(parsed.norms)
    return sentences.join('\n')
  },
}

const sourceArg: string = Deno.args[0] ?? ''
const targetArg: string = Deno.args[1] ?? ''
const stdin: string = Deno.stdin.isTerminal() ? '' : new TextDecoder().decode(await readAll(Deno.stdin))

if (!stdin) {
  console.error('No input. Pipe content via stdin.')
  Deno.exit(1)
}

if (!sourceArg || !targetArg) {
  console.error('Usage: echo "text" | rd express <source> <target>')
  console.error()
  console.error('Formats:')
  console.error('  english')

  for (const name of Object.keys(SCHEMAS)) {
    console.error(`  ${name}`)
  }

  console.error()
  console.error('Examples:')
  console.error('  echo "never use as" | rd express english deontic')
  console.error('  echo \'{"norms":[...]}\' | rd express deontic english')

  Deno.exit(1)
}

const key: string = `${sourceArg}:${targetArg}`
const renderer: Renderer | undefined = RENDERERS[key]
if (renderer) {
  console.log(renderer(stdin))
  Deno.exit(0)
}

const entry: SchemaEntry | undefined = SCHEMAS[targetArg]
if (!entry) {
  console.error(`Unknown route: ${sourceArg} -> ${targetArg}`)
  Deno.exit(1)
}

const raw: string = await structured({
  messages: [{
    role: 'system',
    content: entry.prompt,
  }, {
    role: 'user',
    content: stdin,
  }],
  schema: z.toJSONSchema(entry.schema),
  temperature: 0.2,
  max_tokens: 4096,
})

console.log(raw)
