#!/usr/bin/env -S deno run --allow-run --allow-net

const root: string = new URL('.', import.meta.url).pathname

const commands: Record<string, string> = {
  ask: `${root}tools/ask.ts`,
  commit: `${root}tools/commit.ts`,
  json: `${root}tools/json.ts`,
  research: `${root}tools/research.ts`,
  search: `${root}tools/search.ts`,
}

const [name]: string[] = Deno.args
const args: string[] = Deno.args.slice(1)

if (!name || !commands[name]) {
  console.log('Usage: rd <command> [args]')
  console.log()

  for (const cmd of Object.keys(commands)) {
    console.log(`  ${cmd}`)
  }

  Deno.exit(1)
}

const cmd = new Deno.Command('deno', {
  args: ['run', '--allow-run', '--allow-net', '--allow-read', commands[name], ...args],
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
})

const { code } = await cmd.output()
Deno.exit(code)
