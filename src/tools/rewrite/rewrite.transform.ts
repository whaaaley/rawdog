import { z } from 'zod'
import { structured } from '../../core/completion.ts'
import { formatResponseSchema, parseResponseSchema, type FormatResponse, type Mode, type ParseResponse } from './rewrite.schema.ts'

const DEONTIC_STRENGTHS: string = [
  'obligatory -> positive imperative: "use consistent whitespace"',
  'forbidden -> negate with "do not": "do not use non-null assertions"',
  'permissible -> prefix with "may": "may use type assertions when necessary"',
  'optional -> prefix with "may choose to": "may choose to add commit body"',
  'supererogatory -> prefix with "ideally": "ideally provide comprehensive documentation"',
  'indifferent -> prefix with "either way is fine": "either way is fine for naming style"',
  'omissible -> prefix with "may omit": "may omit post-task explanations"',
].join('\n')

const NEGATION_SIGNALS: string = [
  '"avoid", "never", "do not", "don\'t", "no" -> forbidden',
  '"always", "must", "should", "ensure" -> obligatory',
  '"may", "can", "optionally" -> permissible',
].join('\n')

const MODE_FORMATS: string = [
  'verbose: every rule gets Rule + Reason lines.',
  '  Rule: <directive>',
  '  Reason: <justification>',
  '',
  'balanced (default): include Reason only when non-obvious.',
  '  Rule: <directive>',
  '  Reason: <justification if needed>',
  '',
  'concise: bullet list, no reasons.',
  '  - <directive>',
].join('\n')

const PARSE_SYSTEM: string = [
  'Decompose the input into structured rules.',
  'Each rule has: strength, action, target, context (optional), reason.',
  '',
  'Deontic strengths:',
  DEONTIC_STRENGTHS,
  '',
  'Signal detection:',
  NEGATION_SIGNALS,
].join('\n')

const formatSystem = (mode: Mode): string =>
  [
    'Convert structured rules into natural language.',
    `Mode: ${mode}`,
    '',
    'Format reference:',
    MODE_FORMATS,
  ].join('\n')

export const parse = async (input: string): Promise<ParseResponse> => {
  const result = parseResponseSchema.parse(JSON.parse(
    await structured({
      messages: [{
        role: 'system',
        content: PARSE_SYSTEM,
      }, {
        role: 'user',
        content: input,
      }],
      schema: z.toJSONSchema(parseResponseSchema),
      temperature: 0.2,
      max_tokens: 2048,
    }),
  ))

  return result
}

export const format = async (parsed: ParseResponse, mode: Mode = 'balanced'): Promise<FormatResponse> => {
  const result = formatResponseSchema.parse(JSON.parse(
    await structured({
      messages: [{
        role: 'system',
        content: formatSystem(mode),
      }, {
        role: 'user',
        content: JSON.stringify(parsed),
      }],
      schema: z.toJSONSchema(formatResponseSchema),
      temperature: 0.2,
      max_tokens: 2048,
    }),
  ))

  return result
}

export const rewrite = async (input: string, mode: Mode = 'balanced'): Promise<string[]> => {
  const parsed: ParseResponse = await parse(input)
  const formatted: FormatResponse = await format(parsed, mode)
  return formatted.rules
}
