#!/usr/bin/env -S deno run --allow-run --allow-net

import { exec } from '../helpers/exec.ts'
import { complete } from '../helpers/complete.ts'
import { safe } from '../helpers/safe.ts'

const diff = (await exec('git', ['diff', '--cached'])).stdout

if (!diff) {
  console.error('Nothing staged')
  Deno.exit(1)
}

const content = await complete({
  messages: [
    { role: 'system', content: 'Generate a conventional commit message from the diff. Use lowercase, imperative mood, no trailing punctuation.' },
    { role: 'user', content: diff },
  ],
  schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['feat', 'fix', 'build', 'chore', 'ci', 'docs', 'style', 'refactor', 'perf', 'test', 'revert'],
      },
      scope: { type: 'string' },
      description: { type: 'string', maxLength: 72 },
    },
    required: ['type', 'description'],
  },
  max_tokens: 100,
})

const { data: parsed, error } = safe(() => JSON.parse(content))

if (error || !parsed?.type || !parsed?.description) {
  console.error('Failed to parse response:')
  console.error(content)
  Deno.exit(1)
}

const msg = parsed.scope ? `${parsed.type}(${parsed.scope}): ${parsed.description}` : `${parsed.type}: ${parsed.description}`

console.log(msg)

const commit = new Deno.Command('git', { args: ['commit', '-m', msg], stdout: 'inherit', stderr: 'inherit' })
const { code } = await commit.output()
Deno.exit(code)
