const DEBUG: boolean = Deno.env.get('DEBUG') === '1'

export const debug = (label: string, ...args: unknown[]): void => {
  if (!DEBUG) return
  console.error(`[${label}]`, ...args)
}
