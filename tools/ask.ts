#!/usr/bin/env -S deno run --allow-net

import { stream } from '../helpers/stream.ts'

const question: string = Deno.args.join(' ')
if (!question) {
  console.error('Usage: autoAsk <question>')
  Deno.exit(1)
}

const encoder: TextEncoder = new TextEncoder()
const readable: ReadableStream = await stream([{
  role: 'user',
  content: question,
}], {
  temperature: 0.3,
  max_tokens: 2048,
})

for await (const chunk of readable) {
  Deno.stdout.writeSync(encoder.encode(chunk))
}

Deno.stdout.writeSync(encoder.encode('\n'))
