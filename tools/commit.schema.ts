import { z } from 'zod'

export const commitSchema = z.object({
  type: z.string(),
  scope: z.string().optional(),
  description: z.string(),
})

export type CommitSchema = z.infer<typeof commitSchema>
