import { z } from 'zod'

export const commitConfigSchema = z.object({
  types: z.array(z.string()).optional(),
  scopes: z.array(z.string()).optional(),
  maxLength: z.number().optional(),
})

export const commitSchema = z.object({
  type: z.string(),
  scope: z.string().optional(),
  description: z.string(),
})

export type CommitConfigSchema = z.infer<typeof commitConfigSchema>
export type CommitSchema = z.infer<typeof commitSchema>
