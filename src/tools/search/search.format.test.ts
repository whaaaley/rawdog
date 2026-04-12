import { assertEquals } from '@std/assert'
import { formatHeader, formatResults } from './search.format.ts'

// formatHeader

Deno.test('formatHeader — formats basic header', () => {
  const result = formatHeader('Test results', { total: 10, count: 5 })
  assertEquals(result, 'Test results (showing 1-5 of 10, page 1)')
})

Deno.test('formatHeader — includes offset in range', () => {
  const result = formatHeader('Test results', { total: 50, count: 10, limit: 10, offset: 20 })
  assertEquals(result, 'Test results (showing 21-30 of 50, page 3)')
})

Deno.test('formatHeader — handles zero count', () => {
  const result = formatHeader('Empty', { total: 0, count: 0 })
  assertEquals(result, 'Empty (0 results)')
})

// formatResults

Deno.test('formatResults — renders header and items', () => {
  const result = formatResults({
    label: 'Test',
    items: ['a', 'b'],
    total: 2,
    renderItem: (item: string, i: number): string => `${i + 1}. ${item}`,
  })
  assertEquals(result, [
    'Test (showing 1-2 of 2, page 1)',
    '',
    '1. a',
    '',
    '2. b',
  ].join('\n'))
})

Deno.test('formatResults — handles empty items', () => {
  const result = formatResults({
    label: 'Empty',
    items: [],
    total: 0,
    renderItem: (): string => 'should not appear',
  })
  assertEquals(result, 'Empty (0 results)')
})

Deno.test('formatResults — passes offset to header', () => {
  const result = formatResults({
    label: 'Paged',
    items: ['x'],
    total: 30,
    limit: 10,
    offset: 10,
    renderItem: (item: string): string => item,
  })
  assertEquals(result.startsWith('Paged (showing 11-11 of 30, page 2)'), true)
})
