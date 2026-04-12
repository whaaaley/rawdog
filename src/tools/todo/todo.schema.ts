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
  section: z.string().describe('Existing section name for check/uncheck/remove/edit. For add, use the section name from the command.'),
  action: z.enum(['check', 'uncheck', 'add', 'edit', 'remove']).describe('check = mark done / cross off / finish / complete. uncheck = mark not done.'),
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
