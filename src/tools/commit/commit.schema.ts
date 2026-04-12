import { z } from 'zod'

export const commitSchema = z.object({
  type: z.string(),
  description: z.string(),
})

export type CommitSchema = z.infer<typeof commitSchema> & { scope?: string }

export const commitJsonSchema = (options: { types: string[] }): Record<string, unknown> => {
  const schema = z.object({
    type: z.enum(options.types).describe('.md file → docs. .test. file → test. Otherwise match diff content.'),
    description: z.string().describe('Lowercase imperative. No period.'),
  })

  return z.toJSONSchema(schema)
}
