import { z } from 'zod'

const URL = 'http://localhost:1234/v1/chat/completions'
const MODEL = 'qwen3.5-9b'

const Message = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

const StructuredOptions = z.object({
  messages: z.array(Message),
  schema: z.record(z.string(), z.unknown()),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
})

const ChatResponse = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
    }),
  })),
})

// https://github.com/ggerganov/llama.cpp/blob/master/tools/server/README.md#post-v1chatcompletions
export const structured = async (options: z.infer<typeof StructuredOptions>) => {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: options.messages,
      response_format: { type: 'json_object', schema: options.schema },
      chat_template_kwargs: { enable_thinking: false },
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 256,
    }),
  })

  const data = ChatResponse.parse(await res.json())
  return JSON.parse(data.choices[0].message.content)
}
