import { stream } from './stream.ts'

const encoder = new TextEncoder()

// Stream a synthesized answer to stdout from gathered research context
export const summarize = async (topic: string, context: string[]) => {
  const readable = await stream([
    {
      role: 'system',
      content: 'You synthesize research into a clear, thorough answer. Write naturally. Include specific details, names, dates, and sources when available. Be direct — no filler.',
    },
    {
      role: 'user',
      content: `Research topic: ${topic}\n\nGathered information:\n${context.join('\n\n---\n\n')}`,
    },
  ], { temperature: 0.3, max_tokens: 2048 })

  for await (const chunk of readable) {
    Deno.stdout.writeSync(encoder.encode(chunk))
  }

  Deno.stdout.writeSync(encoder.encode('\n'))
}
