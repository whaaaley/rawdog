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

// Description — no longer needs a schema, returned as plain text
