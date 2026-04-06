import { stream } from '../../core/stream.ts'

const encoder: TextEncoder = new TextEncoder()

export const summarize = async (topic: string, context: string[]): Promise<void> => {
  const readable: ReadableStream<string> = await stream([
    {
      role: 'system',
      content: [
        'Synthesize research into a clear, thorough answer.',
        'Include specific details, names, dates, and sources when available.',
        'Do not speculate beyond the gathered information.',
        'Be direct, no filler.',
      ].join(' '),
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
