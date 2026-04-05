import { safe, safeAsync } from './safe.ts'
import { configSchema } from './config.schema.ts'
import type { ConfigSchema } from './config.schema.ts'

const FILENAME: string = 'rd.config.json'

const load = async (): Promise<ConfigSchema> => {
  const { data: raw, error: readError } = await safeAsync(() => Deno.readTextFile(FILENAME))

  if (readError) {
    return configSchema.parse({})
  }

  const { data, error: parseError } = safe(() => configSchema.parse(JSON.parse(raw)))

  if (parseError) {
    throw new Error(`Failed to parse JSON: ${FILENAME}`)
  }

  return data
}

export const config: ConfigSchema = await load()
