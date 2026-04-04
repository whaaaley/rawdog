#!/usr/bin/env -S deno run --allow-run --allow-net

const commands: Record<string, string> = {
  ask: './tools/ask.ts',
  commit: './tools/commit.ts',
  research: './tools/research.ts',
  search: './tools/search.ts',
}

const name = Deno.args[0]
const args = Deno.args.slice(1)

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
