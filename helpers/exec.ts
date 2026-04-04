export const exec = async (cmd: string, args: string[]) => {
  const c = new Deno.Command(cmd, { args, stdout: 'piped', stderr: 'piped' })
  const { code, stdout, stderr } = await c.output()
  return {
    code,
    stdout: new TextDecoder().decode(stdout).trim(),
    stderr: new TextDecoder().decode(stderr).trim(),
  }
}
