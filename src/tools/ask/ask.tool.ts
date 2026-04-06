#!/usr/bin/env -S deno run --allow-net

import { readAll } from '@std/io'
import { stream } from '../../core/stream.ts'

const args: string = Deno.args.join(' ')
// isTerminal() is false when data is piped in (e.g. echo "hi" | rd ask)
// Without this guard, readAll would block forever waiting for EOF
const stdin: string = Deno.stdin.isTerminal() ? '' : new TextDecoder().decode(await readAll(Deno.stdin))
const question: string = [args, stdin].filter(Boolean).join('\n')

if (!question) {
  console.error('Usage: rd ask <question>')
  Deno.exit(1)
}

const encoder: TextEncoder = new TextEncoder()
const readable: ReadableStream = await stream([{
  role: 'user',
  content: question,
}], {
  temperature: 0.2,
  max_tokens: 2048,
})

for await (const chunk of readable) {
  Deno.stdout.writeSync(encoder.encode(chunk))
}

Deno.stdout.writeSync(encoder.encode('\n'))
