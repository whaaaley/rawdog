import { safe, safeAsync } from './safe.ts'

export const loadConfig = async (filename: string) => {
  const { data: raw, error: readError } = await safeAsync(() => Deno.readTextFile(filename))

  if (readError) {
    return {}
  }

  const { data, error: parseError } = safe(() => JSON.parse(raw))

  if (parseError) {
    throw new Error(`Failed to parse JSON: ${filename}`)
  }

  return data
}
