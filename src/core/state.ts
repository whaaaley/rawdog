import { join } from '@std/path'
import { safe, safeAsync } from '../utils/safe.utils.ts'
import { stateSchema, toolSchemas, type ToolName, type ToolEntry, type StateData } from './state.schema.ts'

const STATE_FILENAME = 'rd.state.json'
const STATE_PATH = join(Deno.env.get('TMPDIR') ?? '/tmp', STATE_FILENAME)

const readAll = async (): Promise<StateData> => {
  const { data: raw, error } = await safeAsync(() => Deno.readTextFile(STATE_PATH))

  if (error) {
    return {}
  }

  const { data: parsed, error: parseError } = safe(() => stateSchema.parse(JSON.parse(raw)))

  if (parseError) {
    return {}
  }

  return parsed
}

const writeAll = async (state: StateData): Promise<void> => {
  await Deno.writeTextFile(STATE_PATH, JSON.stringify(state, null, 2))
}

export const getState = async (tool: ToolName, key: string): Promise<ToolEntry<typeof tool> | null> => {
  const state = await readAll()
  const toolState = state[tool]

  if (!toolState) {
    return null
  }

  const raw = toolState[key]

  if (!raw) {
    return null
  }

  // Re-parse the individual entry through its schema
  const entrySchema = toolSchemas[tool].valueType
  const { data, error } = safe(() => entrySchema.parse(raw))

  if (error) {
    return null
  }

  return data
}

export const setState = async (tool: ToolName, key: string, value: ToolEntry<typeof tool>): Promise<void> => {
  const state = await readAll()
  const current = state[tool]
  const updated = { ...current, [key]: value }

  const { data: validated, error } = safe(() => toolSchemas[tool].parse(updated))

  if (error) {
    throw new Error(`Invalid state for ${tool}: ${error.message}`)
  }

  state[tool] = validated
  await writeAll(state)
}

export const clearState = async (tool: ToolName, key: string): Promise<void> => {
  const state = await readAll()
  const toolState = state[tool]

  if (!toolState) {
    return
  }

  const { [key]: _, ...rest } = toolState
  state[tool] = rest
  await writeAll(state)
}

// Exposed for testing
export const STATE_PATH_FOR_TEST = STATE_PATH
