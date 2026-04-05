#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

import { parseArgs } from '@std/cli/parse-args'
import { rewrite } from '../helpers/rewrite.ts'
import type { RewriteArgs } from '../helpers/rewrite.schema.ts'
import { rewriteArgsSchema } from '../helpers/rewrite.schema.ts'

type RawArgs = ReturnType<typeof parseArgs>
const raw: RawArgs = parseArgs(Deno.args, { string: ['mode'] })

const [file]: (string | number)[] = raw._
const args: RewriteArgs = rewriteArgsSchema.parse({ file, mode: raw.mode })

console.log(`parsing ${args.file}...`)

const input: string = await Deno.readTextFile(args.file)
const rules: string[] = await rewrite(input, args.mode)

await Deno.writeTextFile(args.file, rules.join('\n\n') + '\n')

console.log(`rewrote ${args.file} (${rules.length} rules, mode: ${args.mode})`)
