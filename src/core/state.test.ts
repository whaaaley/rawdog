import { assertEquals } from '@std/assert'
import { getState, setState, clearState, STATE_PATH_FOR_TEST } from './state.ts'

const cleanup = async (): Promise<void> => {
  try {
    await Deno.remove(STATE_PATH_FOR_TEST)
  } catch {
    // file may not exist
  }
}

Deno.test('setState — writes and getState reads back', async () => {
  await cleanup()
  await setState('search', 'hello', { vqd: 'abc123' })
  const result = await getState('search', 'hello')
  assertEquals(result, { vqd: 'abc123' })
  await cleanup()
})

Deno.test('getState — returns null for missing tool', async () => {
  await cleanup()
  const result = await getState('search', 'hello')
  assertEquals(result, null)
  await cleanup()
})

Deno.test('getState — returns null for missing key', async () => {
  await cleanup()
  await setState('search', 'hello', { vqd: 'abc' })
  const result = await getState('search', 'typescript')
  assertEquals(result, null)
  await cleanup()
})

Deno.test('getState — returns empty state when file has invalid JSON', async () => {
  await cleanup()
  await Deno.writeTextFile(STATE_PATH_FOR_TEST, 'not json')
  const result = await getState('search', 'hello')
  assertEquals(result, null)
  await cleanup()
})

Deno.test('setState — preserves other keys in same tool', async () => {
  await cleanup()
  await setState('search', 'hello', { vqd: 'abc' })
  await setState('search', 'typescript', { vqd: 'def' })
  const hello = await getState('search', 'hello')
  const ts = await getState('search', 'typescript')
  assertEquals(hello, { vqd: 'abc' })
  assertEquals(ts, { vqd: 'def' })
  await cleanup()
})

Deno.test('setState — overwrites existing key', async () => {
  await cleanup()
  await setState('search', 'hello', { vqd: 'old' })
  await setState('search', 'hello', { vqd: 'new' })
  const result = await getState('search', 'hello')
  assertEquals(result, { vqd: 'new' })
  await cleanup()
})

Deno.test('clearState — removes a key', async () => {
  await cleanup()
  await setState('search', 'hello', { vqd: 'abc' })
  await clearState('search', 'hello')
  const result = await getState('search', 'hello')
  assertEquals(result, null)
  await cleanup()
})

Deno.test('clearState — no-ops on missing tool', async () => {
  await cleanup()
  await clearState('search', 'hello')
  const result = await getState('search', 'hello')
  assertEquals(result, null)
  await cleanup()
})

Deno.test('clearState — preserves other keys', async () => {
  await cleanup()
  await setState('search', 'hello', { vqd: 'abc' })
  await setState('search', 'typescript', { vqd: 'def' })
  await clearState('search', 'hello')
  const hello = await getState('search', 'hello')
  const ts = await getState('search', 'typescript')
  assertEquals(hello, null)
  assertEquals(ts, { vqd: 'def' })
  await cleanup()
})
