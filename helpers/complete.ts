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
    finish_reason: z.string(),
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
      max_tokens: options.max_tokens ?? 2048,
    }),
  })

  const data = ChatResponse.parse(await res.json())
  const choice = data.choices[0]

  if (choice.finish_reason === 'length') {
    throw new Error(`Response truncated (max_tokens too low): ${choice.message.content}`)
  }

  const raw = choice.message.content

  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`Failed to parse JSON: ${raw}`)
  }
}
