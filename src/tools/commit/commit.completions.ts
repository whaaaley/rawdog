import { type CommitItem, NONE_SCOPE } from '../../core/config.schema.ts'
import { completion } from '../../core/completion.ts'
import { debug } from '../../utils/debug.utils.ts'
import { descriptionJsonSchema, descriptionSchema, scopeJsonSchema, scopeSchema, typeJsonSchema, typeSchema } from './commit.schema.ts'

const TEMPERATURE: number = 0.2
const META = { mode: 'strict' } as const
const MAX_RETRIES: number = 3

// CJK Unified Ideographs + CJK Compatibility + Hangul + Kana
const CJK_PATTERN: RegExp = /[\u4e00-\u9fff\u3400-\u4dbf\uac00-\ud7af\u3040-\u309f\u30a0-\u30ff]/

const formatItems = (items: CommitItem[]): string => {
  return items.map((item) => `- ${item.name}: ${item.description}`).join('\n')
}

// Step 1: generate description (runs first, before type/scope)

type GenerateDescriptionOptions = {
  diff: string
  maxLength: number
  hint?: string
}

export const generateDescription = async (options: GenerateDescriptionOptions): Promise<string> => {
  const jsonSchema = descriptionJsonSchema(options.maxLength)
  const hintClause = options.hint ? `\nThe user wants type "${options.hint}". Use it.` : ''

  const messages = [{
    role: 'system' as const,
    content: [
      'Summarize this diff in one short phrase.',
      'Lowercase imperative.',
      'No period.',
      `Under ${options.maxLength} chars.`,
      hintClause,
      'Raw JSON only.',
    ].join('\n').trim(),
  }, {
    role: 'user' as const,
    content: `Diff:\n${options.diff}`,
  }]

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const raw: string = await completion({
      messages,
      response_format: {
        type: 'json_object',
        schema: jsonSchema,
      },
      max_tokens: 256,
      temperature: TEMPERATURE,
    }, META)

    debug('commit:generateDescription', { raw, attempt })

    if (CJK_PATTERN.test(raw)) {
      debug('commit:generateDescription', { retry: attempt + 1, reason: 'CJK in output' })
      continue
    }

    const parsed = descriptionSchema.parse(JSON.parse(raw))

    if (parsed.description.length > options.maxLength * 1.25) {
      debug('commit:generateDescription', { retry: attempt + 1, reason: 'over length', length: parsed.description.length })
      continue
    }

    return parsed.description
  }

  throw new Error('description generation failed after retries')
}

// Step 2a: classify type (runs in parallel with scope, after description)

type ClassifyTypeOptions = {
  diff: string
  description: string
  types: CommitItem[]
  hint?: string
}

export const classifyType = async (options: ClassifyTypeOptions): Promise<string> => {
  const jsonSchema = typeJsonSchema(options.types)
  const hintClause = options.hint ? `The user wants type "${options.hint}". Use it.\n` : ''

  const messages = [{
    role: 'system' as const,
    content: [
      'You classify git diffs into conventional commit types.',
      hintClause,
      'Pick the single best type from the list below.',
      `Types:\n${formatItems(options.types)}`,
      'Raw JSON only.',
    ].join('\n').trim(),
  }, {
    role: 'user' as const,
    content: `Description: ${options.description}\nDiff:\n${options.diff}`,
  }]

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const raw: string = await completion({
      messages,
      response_format: {
        type: 'json_object',
        schema: jsonSchema,
      },
      max_tokens: 64,
      temperature: TEMPERATURE,
    }, META)

    debug('commit:classifyType', { raw, attempt })

    if (CJK_PATTERN.test(raw)) {
      debug('commit:classifyType', { retry: attempt + 1, reason: 'CJK in output' })
      continue
    }

    const parsed = typeSchema.parse(JSON.parse(raw))

    return parsed.type
  }

  throw new Error('type classification failed after retries')
}

// Step 2b: classify scope (runs in parallel with type, after description)

type ClassifyScopeOptions = {
  diff: string
  description: string
  scopes: CommitItem[]
}

export const classifyScope = async (options: ClassifyScopeOptions): Promise<string | null> => {
  // No scopes configured - skip the completion entirely
  if (options.scopes.length === 0) {
    return null
  }

  const jsonSchema = scopeJsonSchema(options.scopes)

  const messages = [{
    role: 'system' as const,
    content: [
      'You are a conventional commit scope classifier.',
      'Given a diff and allowed scopes, pick the best scope.',
      `Scopes:\n${formatItems([NONE_SCOPE, ...options.scopes])}`,
      'Raw JSON only.',
    ].join('\n'),
  }, {
    role: 'user' as const,
    content: `Description: ${options.description}\nDiff:\n${options.diff}`,
  }]

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const raw: string = await completion({
      messages,
      response_format: {
        type: 'json_object',
        schema: jsonSchema,
      },
      max_tokens: 64,
      temperature: TEMPERATURE,
    }, META)

    debug('commit:classifyScope', { raw, attempt })

    if (CJK_PATTERN.test(raw)) {
      debug('commit:classifyScope', { retry: attempt + 1, reason: 'CJK in output' })
      continue
    }

    const parsed = scopeSchema.parse(JSON.parse(raw))

    return parsed.scope === NONE_SCOPE.name ? null : parsed.scope
  }

  throw new Error('scope classification failed after retries')
}
