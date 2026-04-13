import { z } from 'zod'
import { NONE_SCOPE, type CommitItem } from '../../core/config.schema.ts'

// Type classifier — returns one of the allowed types

export const typeSchema = z.object({
  type: z.string(),
})

export type TypeSchema = z.infer<typeof typeSchema>

export const typeJsonSchema = (types: CommitItem[]): Record<string, unknown> => {
  const names = types.map((t) => t.name)
  const schema = z.object({
    type: z.enum(names),
  })

  return z.toJSONSchema(schema)
}

// Scope classifier — returns one of the allowed scopes

export const scopeSchema = z.object({
  scope: z.string(),
})

export type ScopeSchema = z.infer<typeof scopeSchema>

export const scopeJsonSchema = (scopes: CommitItem[]): Record<string, unknown> => {
  const all = [NONE_SCOPE, ...scopes]
  const names = all.map((s) => s.name)
  const schema = z.object({
    scope: z.enum(names),
  })

  return z.toJSONSchema(schema)
}

// Description — returns the commit message body

export const descriptionSchema = z.object({
  description: z.string(),
})

export type DescriptionSchema = z.infer<typeof descriptionSchema>

export const descriptionJsonSchema = (maxLength: number): Record<string, unknown> => {
  const schema = z.object({
    description: z.string().describe(`Lowercase imperative. No period. Under ${maxLength} chars.`),
  })

  return z.toJSONSchema(schema)
}
