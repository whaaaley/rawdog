import { assertEquals } from '@std/assert'
import { parseDirect, parseIndices, resolveSection, validateIndices } from './todo.direct.ts'
import type { Section } from './todo.schema.ts'

// parseIndices

Deno.test('parseIndices — single number', () => {
  assertEquals(parseIndices('0'), [0])
})

Deno.test('parseIndices — multiple numbers', () => {
  assertEquals(parseIndices('0,1,3'), [0, 1, 3])
})

Deno.test('parseIndices — spaces around commas', () => {
  assertEquals(parseIndices('0 , 1 , 3'), [0, 1, 3])
})

Deno.test('parseIndices — returns null for empty string', () => {
  assertEquals(parseIndices(''), null)
})

Deno.test('parseIndices — returns null for non-numeric', () => {
  assertEquals(parseIndices('abc'), null)
})

Deno.test('parseIndices — returns null for mixed numeric and non-numeric', () => {
  assertEquals(parseIndices('0,abc,2'), null)
})

Deno.test('parseIndices — returns null for negative numbers', () => {
  assertEquals(parseIndices('-1'), null)
})

Deno.test('parseIndices — returns null for trailing comma', () => {
  assertEquals(parseIndices('0,1,'), null)
})

Deno.test('parseIndices — returns null for leading comma', () => {
  assertEquals(parseIndices(',0,1'), null)
})

Deno.test('parseIndices — returns null for floats', () => {
  assertEquals(parseIndices('1.5'), null)
})

// parseDirect

Deno.test('parseDirect — check single index', () => {
  assertEquals(parseDirect('check 0'), { action: 'check', indices: [0], section: null })
})

Deno.test('parseDirect — uncheck multiple indices', () => {
  assertEquals(parseDirect('uncheck 0,1,3'), { action: 'uncheck', indices: [0, 1, 3], section: null })
})

Deno.test('parseDirect — remove with section', () => {
  assertEquals(parseDirect('remove 2 in server'), { action: 'remove', indices: [2], section: 'server' })
})

Deno.test('parseDirect — section name with spaces', () => {
  assertEquals(parseDirect('check 0,2 in backend api'), { action: 'check', indices: [0, 2], section: 'backend api' })
})

Deno.test('parseDirect — returns null for add action', () => {
  assertEquals(parseDirect('add 0'), null)
})

Deno.test('parseDirect — returns null for edit action', () => {
  assertEquals(parseDirect('edit 0'), null)
})

Deno.test('parseDirect — returns null for unknown action', () => {
  assertEquals(parseDirect('foo 0'), null)
})

Deno.test('parseDirect — returns null for empty string', () => {
  assertEquals(parseDirect(''), null)
})

Deno.test('parseDirect — returns null for single word', () => {
  assertEquals(parseDirect('check'), null)
})

Deno.test('parseDirect — returns null for natural language', () => {
  assertEquals(parseDirect('check the rate limiting one'), null)
})

Deno.test('parseDirect — returns null for extra words without in', () => {
  assertEquals(parseDirect('check 0 something else'), null)
})

Deno.test('parseDirect — trims whitespace', () => {
  assertEquals(parseDirect('  check   0  '), { action: 'check', indices: [0], section: null })
})

Deno.test('parseDirect — "in" alone without section returns section as null (words.length < 4)', () => {
  // "check 0 in" => words = ['check', '0', 'in'] => length 3, no "in <section>" match, length <= 3 so falls through
  assertEquals(parseDirect('check 0 in'), { action: 'check', indices: [0], section: null })
})

// resolveSection

const sections: Section[] = [
  { name: 'backend api', items: [{ content: 'set up auth', done: false }] },
  { name: 'frontend ui', items: [{ content: 'build login page', done: false }] },
]

const singleSection: Section[] = [
  { name: 'server', items: [{ content: 'deploy', done: false }] },
]

Deno.test('resolveSection — finds section by name', () => {
  assertEquals(resolveSection(sections, 'backend api'), sections[0])
})

Deno.test('resolveSection — returns null for nonexistent section', () => {
  assertEquals(resolveSection(sections, 'devops'), null)
})

Deno.test('resolveSection — returns single section when name is null', () => {
  assertEquals(resolveSection(singleSection, null), singleSection[0])
})

Deno.test('resolveSection — returns null for multi-section when name is null', () => {
  assertEquals(resolveSection(sections, null), null)
})

Deno.test('resolveSection — returns null for empty sections when name is null', () => {
  assertEquals(resolveSection([], null), null)
})

// validateIndices

Deno.test('validateIndices — returns empty for all valid indices', () => {
  assertEquals(validateIndices([0, 1, 2], 3), [])
})

Deno.test('validateIndices — returns out-of-range indices', () => {
  assertEquals(validateIndices([0, 5, 2, 10], 3), [5, 10])
})

Deno.test('validateIndices — returns empty for empty indices', () => {
  assertEquals(validateIndices([], 3), [])
})

Deno.test('validateIndices — all indices out of range', () => {
  assertEquals(validateIndices([3, 4, 5], 3), [3, 4, 5])
})

Deno.test('validateIndices — catches negative indices', () => {
  assertEquals(validateIndices([-1, 0, 1], 3), [-1])
})

Deno.test('validateIndices — empty list means all indices are out of range', () => {
  assertEquals(validateIndices([0], 0), [0])
})
