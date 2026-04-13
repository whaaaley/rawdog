#!/usr/bin/env -S deno run --allow-run --allow-net --allow-read

import { parseArgs } from '@std/cli'
import { exec } from '../../utils/exec.utils.ts'
import { config } from '../../core/config.ts'
import { confirm } from '../../utils/confirm.utils.ts'
import { classifyType, classifyScope, generateDescription } from './commit.completions.ts'
import type { CommitItem } from '../../core/config.schema.ts'

const args = parseArgs(Deno.args, { string: [] })
const hint: string | undefined = args._.length > 0 ? String(args._[0]) : undefined

const types: CommitItem[] = config.commit.types
const scopes: CommitItem[] = config.commit.scopes
const maxLength: number = config.commit.maxLength

const diff: string = (await exec('git', ['diff', '--cached'])).stdout

if (!diff) {
  console.error('Nothing staged')
  Deno.exit(1)
}

// Step 1: generate description (runs first to provide context)
const rawDescription: string = await generateDescription({ diff, maxLength, hint })

// Step 2: classify type and scope sequentially
// Parallel requests cause slower model output on local inference
const type: string = await classifyType({ diff, description: rawDescription, types, hint })
const scope: string | null = await classifyScope({ diff, description: rawDescription, scopes })

// Step 3: assemble message
const msg: string = scope ? `${type}(${scope}): ${rawDescription}` : `${type}: ${rawDescription}`

console.log(msg)

if (!await confirm('Commit?')) {
  Deno.exit(0)
}

const commit: Deno.Command = new Deno.Command('git', { args: ['commit', '-m', msg], stdout: 'inherit', stderr: 'inherit' })
const output: Deno.CommandOutput = await commit.output()

Deno.exit(output.code)
