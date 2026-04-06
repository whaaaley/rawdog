import { assertEquals } from '@std/assert'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import type { Root, RootContent } from 'mdast'
import { items, name, parse } from './todo.parse.ts'
import type { Section } from './todo.schema.ts'

const node = (raw: string): RootContent => {
  const tree: Root = fromMarkdown(raw, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })

  const [first]: RootContent[] = tree.children
  if (!first) throw new Error('empty tree')

  return first
}

// name

Deno.test('name — returns heading text for h2', () => {
  assertEquals(name(node('## server')), 'server')
})

Deno.test('name — returns null for h1', () => {
  assertEquals(name(node('# title')), null)
})

Deno.test('name — returns null for paragraph', () => {
  assertEquals(name(node('hello')), null)
})

Deno.test('name — returns null for non-text heading', () => {
  assertEquals(name(node('## **bold**')), null)
})

// items

Deno.test('items — returns items from checkbox list', () => {
  assertEquals(items(node('- [ ] first\n- [x] second')), [
    { content: 'first', done: false },
    { content: 'second', done: true },
  ])
})

Deno.test('items — returns empty for non-list', () => {
  assertEquals(items(node('## server')), [])
})

Deno.test('items — skips non-paragraph list items', () => {
  assertEquals(items(node('- > quote')), [])
})

// parse

Deno.test('parse — multiple sections', () => {
  const raw: string = '## server\n- [ ] set up postgres\n\n## client\n- [x] build login page\n- [ ] add dark mode\n'
  const result: Section[] = parse(raw)

  assertEquals(result, [{
    name: 'server',
    items: [{ content: 'set up postgres', done: false }],
  }, {
    name: 'client',
    items: [
      { content: 'build login page', done: true },
      { content: 'add dark mode', done: false },
    ],
  }])
})

Deno.test('parse — no headings returns empty', () => {
  const raw: string = '- [ ] orphan item\n'
  const result: Section[] = parse(raw)

  assertEquals(result, [])
})

Deno.test('parse — ignores non-h2 headings', () => {
  const raw: string = '# title\n## server\n- [ ] task\n### subsection\n- [ ] nested\n'
  const result: Section[] = parse(raw)

  assertEquals(result, [{
    name: 'server',
    items: [
      { content: 'task', done: false },
      { content: 'nested', done: false },
    ],
  }])
})
