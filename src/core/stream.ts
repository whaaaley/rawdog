import { sseChunkSchema, type MessageSchema, type SseChunkSchema } from './completion.schema.ts'
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

      lines
        .filter((line: string) => line.startsWith('data: '))
        .map((line: string) => line.slice(6))
        .forEach((data: string) => {
          if (data === '[DONE]') return

          const parsed: SseChunkSchema = sseChunkSchema.parse(JSON.parse(data))
          const [choice]: SseChunkSchema['choices'] = parsed.choices
          const content: string | undefined = choice?.delta?.content

          if (content) controller.enqueue(content)
        })
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
