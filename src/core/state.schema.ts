import { z } from 'zod'

export const searchStateSchema = z.object({
  vqd: z.string(),
})

export const toolSchemas = {
  search: z.record(z.string(), searchStateSchema),
} as const

export type ToolName = keyof typeof toolSchemas
export type ToolEntry<T extends ToolName> = z.infer<(typeof toolSchemas)[T]>[string]

export const stateSchema = z.object({
  search: toolSchemas.search.optional(),
})

export type StateData = z.infer<typeof stateSchema>
