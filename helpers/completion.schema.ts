import { z } from 'zod'

export const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

export const responseFormatSchema = z.object({
  type: z.literal('json_object'),
  schema: z.record(z.string(), z.unknown()),
})

export const completionOptionsSchema = z.object({
  messages: z.array(messageSchema),
  response_format: responseFormatSchema.optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
})

export const structuredOptionsSchema = completionOptionsSchema.extend({
  schema: z.record(z.string(), z.unknown()),
})

export const choiceSchema = z.object({
  finish_reason: z.string(),
  message: z.object({
    content: z.string(),
  }),
})

export const chatResponseSchema = z.object({
  choices: z.array(choiceSchema),
})

export type MessageSchema = z.infer<typeof messageSchema>
export type CompletionOptionsSchema = z.infer<typeof completionOptionsSchema>
export type StructuredOptionsSchema = z.infer<typeof structuredOptionsSchema>
export type ChoiceSchema = z.infer<typeof choiceSchema>
export type ChatResponseSchema = z.infer<typeof chatResponseSchema>
