const URL = 'http://localhost:1234/v1/chat/completions'
const MODEL = 'qwen3.5-9b'

type Message = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type StreamOptions = {
  temperature?: number
  max_tokens?: number
}

// Parse SSE lines into content deltas
const sse = () => {
  let buf = ''

  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buf += chunk

      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue

        const data = line.slice(6)
        if (data === '[DONE]') return

        const delta = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) controller.enqueue(delta)
      }
    },
  })
}

// Returns a ReadableStream of text deltas from llama-server
export const stream = async (messages: Message[], options?: StreamOptions) => {
  const res = await fetch(URL, {
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

  if (!res.body) throw new Error('No response body')

  return res.body.pipeThrough(new TextDecoderStream()).pipeThrough(sse())
}
