export const confirm = async (message: string): Promise<boolean> => {
  const encoder: TextEncoder = new TextEncoder()
  const buf: Uint8Array = new Uint8Array(1)

  await Deno.stdout.write(encoder.encode(`${message} [Y/n] `))

  Deno.stdin.setRaw(true)
  const n: number | null = await Deno.stdin.read(buf)
  Deno.stdin.setRaw(false)

  const key: number = n ? buf[0] : 0
  const rejected: boolean = key === 110 || key === 78 // n or N

  await Deno.stdout.write(encoder.encode(rejected ? 'n\n' : 'y\n'))

  return !rejected
}
