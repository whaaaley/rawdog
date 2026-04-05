import { z } from 'zod'

export const strengthSchema = z.enum([
  'obligatory',
  'permissible',
  'forbidden',
  'optional',
  'supererogatory',
  'indifferent',
  'omissible',
])

export const parsedRuleSchema = z.object({
  strength: strengthSchema,
  action: z.string(),
  target: z.string(),
  context: z.string().optional(),
  reason: z.string(),
})

export const parseResponseSchema = z.object({
  rules: z.array(parsedRuleSchema),
})

export const formatResponseSchema = z.object({
  rules: z.array(z.string()),
})

export const modeSchema = z.enum(['verbose', 'balanced', 'concise'])

export const rewriteArgsSchema = z.object({
  file: z.string(),
  mode: modeSchema.default('balanced'),
})

export type ParseResponse = z.infer<typeof parseResponseSchema>
export type FormatResponse = z.infer<typeof formatResponseSchema>
export type Mode = z.infer<typeof modeSchema>
export type RewriteArgs = z.infer<typeof rewriteArgsSchema>
