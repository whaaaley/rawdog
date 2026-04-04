import { z } from 'zod'

export const querySchema = z.object({
  query: z.string().describe('A concise search engine query to research the topic'),
})

export const candidatesSchema = z.object({
  picks: z.array(z.object({
    index: z.number().describe('Index of the search result to fetch'),
    reason: z.string().describe('Why this result is likely useful'),
  })).describe('The most promising results to fetch, max 3'),
})

export const evaluateSchema = z.object({
  sufficient: z.boolean().describe('True if the gathered info can answer the question'),
  summary: z.string().describe('Brief summary of what we know so far'),
  next_query: z.string().optional().describe('A refined search query if not sufficient'),
})

export type QuerySchema = z.infer<typeof querySchema>
export type CandidatesSchema = z.infer<typeof candidatesSchema>
export type EvaluateSchema = z.infer<typeof evaluateSchema>
