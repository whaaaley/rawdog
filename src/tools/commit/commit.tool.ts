#!/usr/bin/env -S deno run --allow-run --allow-net --allow-read

import { exec } from '../../utils/exec.utils.ts'
import { config } from '../../core/config.ts'
import { confirm } from '../../utils/confirm.utils.ts'
import { generate } from './commit.completions.ts'
import { parseNumstat, resolveScope } from './commit.scope.ts'
import type { CommitSchema } from './commit.schema.ts'

const types: string[] = config.commit.types
const scopes: string[] = config.commit.scopes
const maxLength: number = config.commit.maxLength

const numstat: string = (await exec('git', ['diff', '--cached', '--numstat'])).stdout
const diff: string = (await exec('git', ['diff', '--cached'])).stdout

if (!diff) {
  console.error('Nothing staged')
  Deno.exit(1)
}

const files = parseNumstat(numstat)
const scope: string | undefined = resolveScope(files, scopes)

const parsed: CommitSchema = await generate({ diff, types, scope, maxLength })
const msg: string = parsed.scope ? `${parsed.type}(${parsed.scope}): ${parsed.description}` : `${parsed.type}: ${parsed.description}`

console.log(msg)

if (!await confirm('Commit?')) {
  Deno.exit(0)
}

const commit: Deno.Command = new Deno.Command('git', { args: ['commit', '-m', msg], stdout: 'inherit', stderr: 'inherit' })
const output: Deno.CommandOutput = await commit.output()

Deno.exit(output.code)
