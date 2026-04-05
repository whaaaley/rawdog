#!/usr/bin/env -S deno run --allow-run --allow-net

const root: string = new URL('.', import.meta.url).pathname

const commands: Record<string, string> = {
  ask: `${root}src/tools/ask/ask.tool.ts`,
  commit: `${root}src/tools/commit/commit.tool.ts`,
  fromSchema: `${root}src/tools/json/json.fromSchema.ts`,
  json: `${root}src/tools/json/json.tool.ts`,
  jsonStrict: `${root}src/tools/json/json.strict.ts`,
  research: `${root}src/tools/research/research.tool.ts`,
  rewrite: `${root}src/tools/rewrite/rewrite.tool.ts`,
  search: `${root}src/tools/search/search.tool.ts`,
  toSchema: `${root}src/tools/json/json.toSchema.ts`,
}

const [name]: string[] = Deno.args
const args: string[] = Deno.args.slice(1)

if (!name || !commands[name]) {
  console.error('Usage: rd <command> [args]')
  console.error()

  for (const cmd of Object.keys(commands)) {
    console.error(`  ${cmd}`)
  }

  Deno.exit(1)
}

const cmd = new Deno.Command('deno', {
  args: ['run', '--allow-run', '--allow-net', '--allow-read', '--allow-write', commands[name], ...args],
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
})

const { code } = await cmd.output()
Deno.exit(code)
