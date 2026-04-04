import { z } from 'zod'

export const searchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  abstract: z.string(),
})

export type SearchResult = z.infer<typeof searchResultSchema>
