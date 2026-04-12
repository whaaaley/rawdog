import { completion } from '../../core/completion.ts'
import { debug } from '../../utils/debug.utils.ts'
import { commitJsonSchema, type CommitSchema, commitSchema } from './commit.schema.ts'

const TEMPERATURE: number = 0.2
const META = { mode: 'strict' } as const
const MAX_RETRIES: number = 3

// CJK Unified Ideographs + CJK Compatibility + Hangul + Kana
const CJK_PATTERN: RegExp = /[\u4e00-\u9fff\u3400-\u4dbf\uac00-\ud7af\u3040-\u309f\u30a0-\u30ff]/

type CommitOptions = {
  diff: string
  types: string[]
  scope?: string
  maxLength: number
}

export const generate = async (options: CommitOptions): Promise<CommitSchema> => {
  const jsonSchema = commitJsonSchema({ types: options.types })

  const messages = [{
    role: 'system' as const,
    content: `Conventional commit from diff. Raw JSON only. Full line under ${options.maxLength} chars. .md file → type docs. .test. file → type test.`,
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

    debug('commit:generate', { messages, raw, attempt })

    // Thinking tokens leaking into output (qwen3 bug)
    if (CJK_PATTERN.test(raw)) {
      debug('commit:generate', { retry: attempt + 1, reason: 'CJK in output' })
      continue
    }

    const parsed = commitSchema.parse(JSON.parse(raw))
    // Check description length against 125% of maxLength
    if (parsed.description.length > options.maxLength * 1.25) {
      debug('commit:generate', { retry: attempt + 1, reason: 'over length', length: parsed.description.length })
      continue
    }

    return { ...parsed, scope: options.scope }
  }

  throw new Error('commit generation failed after retries')
}
