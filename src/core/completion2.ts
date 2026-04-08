import { type ChatResponseSchema, chatResponseSchema, type ChoiceSchema, type CompletionOptionsSchema, type MessageSchema } from './completion.schema.ts'
import { config } from './config.ts'

// https://github.com/ggerganov/llama.cpp/blob/master/tools/server/README.md#post-v1chatcompletions

const URL: string = config.server.url
const MODEL: string = config.server.model

type Meta = {
  mode?: 'strict' | 'loose'
}

const mergeSystem = (msgs: MessageSchema[]): MessageSchema[] => {
  const system: string = msgs.filter((m: MessageSchema) => m.role === 'system').map((m: MessageSchema) => m.content).join(' ')
  const rest: MessageSchema[] = msgs.filter((m: MessageSchema) => m.role !== 'system')
  return system ? [{ role: 'system', content: system }, ...rest] : rest
}

export const completion = async (options: CompletionOptionsSchema, meta: Meta = {}): Promise<string> => {
  const mode: 'strict' | 'loose' = meta.mode ?? 'strict'
  const messages: MessageSchema[] = [...options.messages]

  if (mode === 'loose' && options.response_format && options.response_format.schema) {
    messages.push({
      role: 'system',
      content: `Output only valid JSON matching this schema. No markdown, no code fences, no explanation. ${JSON.stringify(options.response_format.schema)}`,
    })
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: mergeSystem(messages),
    chat_template_kwargs: {
      enable_thinking: false,
    },
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 1024,
  }

  if (mode === 'strict' && options.response_format) {
    body.response_format = options.response_format
  }

  const res: Response = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data: ChatResponseSchema = chatResponseSchema.parse(await res.json())
  const [choice]: ChoiceSchema[] = data.choices

  if (!choice) {
    throw new Error('No choices in response')
  }

  if (choice.finish_reason === 'length') {
    throw new Error(`Response truncated (max_tokens too low): ${choice.message.content}`)
  }

  return choice.message.content
}
