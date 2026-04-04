import { z } from 'zod'

export const querySchema = z.object({
  query: z.string().describe('A concise search engine query to research the topic'),
})

export const candidatesSchema = z.object({
  indices: z.array(z.number()).max(3).describe('Indices of the most relevant results to fetch'),
})

export type QuerySchema = z.infer<typeof querySchema>
export type CandidatesSchema = z.infer<typeof candidatesSchema>
