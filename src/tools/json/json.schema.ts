import { z } from 'zod'

export const jsonObjectSchema = z.record(z.string(), z.unknown())

export type JsonObject = z.infer<typeof jsonObjectSchema>
