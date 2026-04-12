import { assertEquals } from '@std/assert'
import { renderSearchResult } from './search.render.ts'

Deno.test('renderSearchResult — returns three lines with 1-based index', () => {
  const result = { title: 'TypeScript', url: 'https://typescriptlang.org', abstract: 'A typed superset of JavaScript' }
  const lines = renderSearchResult(result, 0).split('\n')
  assertEquals(lines.length, 3)
  assertEquals(lines[0], '1. TypeScript')
  assertEquals(lines[1], '   https://typescriptlang.org')
  assertEquals(lines[2], '   A typed superset of JavaScript')
})

Deno.test('renderSearchResult — uses correct index for non-zero position', () => {
  const result = { title: 'Test', url: 'https://example.com', abstract: 'Abstract' }
  const lines = renderSearchResult(result, 4).split('\n')
  assertEquals(lines[0], '5. Test')
})

Deno.test('renderSearchResult — normalizes HTML in abstract', () => {
  const result = { title: 'Test', url: 'https://example.com', abstract: 'Hello <b>world</b> &amp; friends' }
  const lines = renderSearchResult(result, 0).split('\n')
  assertEquals(lines[2], '   Hello world & friends')
})
