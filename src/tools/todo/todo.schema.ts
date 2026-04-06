import { z } from 'zod'

export const itemSchema = z.object({
  content: z.string().describe('Short actionable task description'),
  done: z.boolean(),
})

export const sectionSchema = z.object({
  name: z.string(),
  items: z.array(itemSchema),
})

export const routeSchema = z.object({
  section: z.string().describe('Exact section name from the command, not from the current list. Can be a new section.'),
  action: z.enum(['check', 'uncheck', 'add', 'edit', 'remove']).describe('What to do with the items'),
})

export const indicesSchema = z.object({
  indices: z.array(z.number().describe('Zero-based index from the list')),
})

export const insertSchema = z.object({
  index: z.number().describe('Zero-based position to insert at'),
  items: z.array(z.string().describe('New task description')),
})

export const editSchema = z.object({
  index: z.number().describe('Zero-based index of the item to edit'),
  content: z.string().describe('New task description'),
})

export type Item = z.infer<typeof itemSchema>
export type Section = z.infer<typeof sectionSchema>
export type Route = z.infer<typeof routeSchema>
export type Indices = z.infer<typeof indicesSchema>
export type Insert = z.infer<typeof insertSchema>
export type Edit = z.infer<typeof editSchema>
