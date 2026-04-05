import { z } from 'zod'

const DEFAULT_USER_AGENT: string = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const DEFAULT_MAX_TEXT_LENGTH: number = 8000
const DEFAULT_DDG_URL: string = 'https://html.duckduckgo.com/html/'
const DEFAULT_GOOGLE_URL: string = 'https://www.google.com/search'

export const configSchema = z.object({
  commit: z.object({
    types: z.array(z.string()).optional(),
    scopes: z.array(z.string()).optional(),
    maxLength: z.number().optional(),
  }).default({}),
  research: z.object({
    userAgent: z.string().default(DEFAULT_USER_AGENT),
    maxTextLength: z.number().default(DEFAULT_MAX_TEXT_LENGTH),
    ddgUrl: z.string().default(DEFAULT_DDG_URL),
    googleUrl: z.string().default(DEFAULT_GOOGLE_URL),
  }).default({
    userAgent: DEFAULT_USER_AGENT,
    maxTextLength: DEFAULT_MAX_TEXT_LENGTH,
    ddgUrl: DEFAULT_DDG_URL,
    googleUrl: DEFAULT_GOOGLE_URL,
  }),
})

export type ConfigSchema = z.infer<typeof configSchema>
