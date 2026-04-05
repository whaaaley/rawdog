#!/usr/bin/env -S deno run --allow-run --allow-net --allow-read

import { exec } from '../helpers/exec.ts'
import { structured } from '../helpers/completion.ts'
import { config } from '../helpers/config.ts'
import { confirm } from '../helpers/confirm.ts'
import { commitSchema } from './commit.schema.ts'
import type { ConfigSchema } from '../helpers/config.schema.ts'
import type { CommitSchema } from './commit.schema.ts'

const DEFAULT_TYPES: string[] = ['feat', 'fix', 'build', 'chore', 'ci', 'docs', 'style', 'refactor', 'perf', 'test', 'revert']
const DEFAULT_SCOPES: string[] = []
const DEFAULT_MAX_LENGTH = 96

const raw: ConfigSchema['commit'] = config.commit

const types: string[] = raw.types ?? DEFAULT_TYPES
const scopes: string[] = raw.scopes ?? DEFAULT_SCOPES
const maxLength: number = raw.maxLength ?? DEFAULT_MAX_LENGTH

const stat: string = (await exec('git', ['diff', '--cached', '--stat'])).stdout
const diff: string = (await exec('git', ['diff', '--cached'])).stdout

if (!diff) {
  console.error('Nothing staged')
  Deno.exit(1)
}

const jsonSchema = {
  type: 'object' as const,
  properties: {
    type: {
      type: 'string',
      enum: types,
      description: 'Determined by the filenames in the stat, not by the diff content',
    },
    scope: {
      type: 'string',
      enum: scopes,
      description: 'The area of the codebase that changed, determined by the filenames in the stat',
    },
    description: {
      type: 'string',
      maxLength: maxLength,
      description: 'What changed, not what the changed content contains. Lowercase, imperative mood, no trailing punctuation',
    },
  },
  required: ['type', 'description'],
}

const result: string = await structured({
  messages: [{
    role: 'system',
    content: [
      'Generate a conventional commit message from the diff.',
      'A change to a markdown file is always typed as docs.',
    ].join(' '),
  }, {
    role: 'user',
    content: `Files changed:\n${stat}\n\nDiff:\n${diff}`,
  }],
  schema: jsonSchema,
  max_tokens: 100,
})

const parsed: CommitSchema = commitSchema.parse(JSON.parse(result))
const msg: string = parsed.scope ? `${parsed.type}(${parsed.scope}): ${parsed.description}` : `${parsed.type}: ${parsed.description}`

console.log(msg)

if (!await confirm('Commit?')) {
  Deno.exit(0)
}

const commit: Deno.Command = new Deno.Command('git', { args: ['commit', '-m', msg], stdout: 'inherit', stderr: 'inherit' })
const output: Deno.CommandOutput = await commit.output()

Deno.exit(output.code)
