#!/usr/bin/env -S deno run --allow-run --allow-net

import { z } from 'zod'
import { exec } from '../helpers/exec.ts'
import { structured } from '../helpers/complete.ts'

const diff = (await exec('git', ['diff', '--cached'])).stdout

if (!diff) {
  console.error('Nothing staged')
  Deno.exit(1)
}

const commitSchema = z.object({
  type: z.enum(['feat', 'fix', 'build', 'chore', 'ci', 'docs', 'style', 'refactor', 'perf', 'test', 'revert']),
  scope: z.string().optional(),
  description: z.string().max(72),
})

const result = await structured({
  messages: [
    { role: 'system', content: 'Generate a conventional commit message from the diff. Use lowercase, imperative mood, no trailing punctuation.' },
    { role: 'user', content: diff },
  ],
  schema: z.toJSONSchema(commitSchema),
  max_tokens: 100,
})

const parsed = commitSchema.parse(result)

const msg = parsed.scope ? `${parsed.type}(${parsed.scope}): ${parsed.description}` : `${parsed.type}: ${parsed.description}`

console.log(msg)

const commit = new Deno.Command('git', { args: ['commit', '-m', msg], stdout: 'inherit', stderr: 'inherit' })
const { code } = await commit.output()
Deno.exit(code)
