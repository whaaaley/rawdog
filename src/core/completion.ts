import { chatResponseSchema, type ChatResponseSchema, type ChoiceSchema, type CompletionOptionsSchema, type StructuredOptionsSchema } from './completion.schema.ts'
import { config } from './config.ts'

// https://github.com/ggerganov/llama.cpp/blob/master/tools/server/README.md#post-v1chatcompletions

const URL: string = config.server.url
const MODEL: string = config.server.model

export const completion = async (options: CompletionOptionsSchema): Promise<string> => {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: options.messages,
    chat_template_kwargs: {
      enable_thinking: false,
    },
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 1024,
  }

  if (options.response_format) {
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

export const structured = (options: StructuredOptionsSchema): Promise<string> => {
  return completion({
    ...options,
    response_format: {
      type: 'json_object',
      schema: options.schema,
    },
  })
}
