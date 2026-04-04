import { chatResponseSchema } from './structured.schema.ts'
import type { ChatResponseSchema, ChoiceSchema, StructuredOptionsSchema } from './structured.schema.ts'

// https://github.com/ggerganov/llama.cpp/blob/master/tools/server/README.md#post-v1chatcompletions

const URL: string = 'http://localhost:1234/v1/chat/completions'
const MODEL: string = 'qwen3.5-9b'

export const structured = async (options: StructuredOptionsSchema): Promise<string> => {
  const res: Response = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: options.messages,
      response_format: {
        type: 'json_object',
        schema: options.schema,
      },
      chat_template_kwargs: {
        enable_thinking: false,
      },
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 2048,
    }),
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
