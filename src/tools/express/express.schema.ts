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

export const normSchema = z.object({
  strength: strengthSchema,
  proposition: z.string().describe('The complete directive phrase'),
  condition: z.string().optional().describe('When or where the norm applies, if conditional'),
  reason: z.string().optional().describe('Why this norm exists'),
})

export const deonticSchema = z.object({
  norms: z.array(normSchema),
})

export const deonticEnglishSchema = z.object({
  sentences: z.array(z.string().describe('A clear English sentence expressing a deontic norm')),
})

export type Strength = z.infer<typeof strengthSchema>
export type Norm = z.infer<typeof normSchema>
export type Deontic = z.infer<typeof deonticSchema>
export type DeonticEnglish = z.infer<typeof deonticEnglishSchema>
