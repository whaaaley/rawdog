import { type MessageSchema, type SseChunkSchema, sseChunkSchema } from './completion.schema.ts'
import { config } from './config.ts'

const URL: string = config.server.url
const MODEL: string = config.server.model

type StreamOptions = {
  temperature?: number
  max_tokens?: number
}

const sse = (): TransformStream<string, string> => {
  let buf: string = ''

  return new TransformStream<string, string>({
    transform(chunk: string, controller: TransformStreamDefaultController<string>): void {
      buf += chunk

      const lines: string[] = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue

        const data: string = line.slice(6)
        if (data === '[DONE]') continue

        const result = sseChunkSchema.safeParse(JSON.parse(data))
        if (!result.success) continue

        const [choice]: SseChunkSchema['choices'] = result.data.choices
        if (!choice) continue

        const content: string | null = choice.delta.content
        if (content) controller.enqueue(content)
      }
    },
  })
}

export const stream = async (messages: MessageSchema[], options?: StreamOptions): Promise<ReadableStream<string>> => {
  const res: Response = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      chat_template_kwargs: { enable_thinking: false },
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 2048,
      stream: true,
    }),
  })

  if (!res.body) {
    throw new Error('No response body')
  }

  return res.body.pipeThrough(new TextDecoderStream()).pipeThrough(sse())
}
