type Message = { role: 'system' | 'user' | 'assistant'; content: string }

// deno-lint-ignore no-explicit-any
type CompletionOptions = {
  messages: Message[]
  schema?: Record<string, unknown>
  temperature?: number
  max_tokens?: number
}

// https://github.com/ggerganov/llama.cpp/blob/master/tools/server/README.md#post-v1chatcompletions
export const complete = async (options: CompletionOptions): Promise<string> => {
  const res = await fetch('http://localhost:1234/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5-9b',
      messages: options.messages,
      ...(options.schema && { response_format: { type: 'json_object', schema: options.schema } }),
      chat_template_kwargs: { enable_thinking: false },
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 256,
    }),
  })

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
