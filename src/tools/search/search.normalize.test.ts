import { assertEquals } from '@std/assert'
import { normalizeBlurb } from './search.normalize.ts'

Deno.test('normalizeBlurb — strips HTML tags', () => {
  assertEquals(normalizeBlurb('Hello <b>world</b>'), 'Hello world')
})

Deno.test('normalizeBlurb — decodes named HTML entities', () => {
  assertEquals(normalizeBlurb('rock &amp; roll'), 'rock & roll')
})

Deno.test('normalizeBlurb — decodes numeric HTML entities', () => {
  assertEquals(normalizeBlurb('&#169; 2025'), '\u00A9 2025')
})

Deno.test('normalizeBlurb — decodes hex HTML entities', () => {
  assertEquals(normalizeBlurb('&#xA9; 2025'), '\u00A9 2025')
})

Deno.test('normalizeBlurb — collapses whitespace', () => {
  assertEquals(normalizeBlurb('hello   \n\t  world'), 'hello world')
})

Deno.test('normalizeBlurb — trims leading and trailing whitespace', () => {
  assertEquals(normalizeBlurb('  hello  '), 'hello')
})

Deno.test('normalizeBlurb — handles combined tags, entities, and whitespace', () => {
  assertEquals(normalizeBlurb('<p>foo &amp; bar</p>  \n  <span>baz</span>'), 'foo & bar baz')
})

Deno.test('normalizeBlurb — returns empty string for empty input', () => {
  assertEquals(normalizeBlurb(''), '')
})
