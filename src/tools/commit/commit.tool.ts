#!/usr/bin/env -S deno run --allow-run --allow-net --allow-read

import { parseArgs } from '@std/cli'
import { exec } from '../../utils/exec.utils.ts'
import { config } from '../../core/config.ts'
import { confirm } from '../../utils/confirm.utils.ts'
import { summarizeDiff, classifyType, classifyScope, generateDescription } from './commit.completions.ts'
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

// Step 1: summarize the diff
const summary: string = await summarizeDiff({ diff })

// Step 2: classify type
const type: string = await classifyType({ summary, types, hint })

// Step 3: classify scope
const scope: string | null = await classifyScope({ summary, scopes })

// Step 4: generate description from summary and type
const description: string = await generateDescription({ diff, type, maxLength, hint })

// Assemble message
const msg: string = scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`

console.log(msg)

if (!await confirm('Commit?')) {
  Deno.exit(0)
}

const commit: Deno.Command = new Deno.Command('git', { args: ['commit', '-m', msg], stdout: 'inherit', stderr: 'inherit' })
const output: Deno.CommandOutput = await commit.output()

Deno.exit(output.code)
