import { z } from 'zod'

export const configSchema = z.object({
  commit: z.object({
    types: z.array(z.string()).optional(),
    scopes: z.array(z.string()).optional(),
    maxLength: z.number().optional(),
  }).default({}),
})

export type ConfigSchema = z.infer<typeof configSchema>
