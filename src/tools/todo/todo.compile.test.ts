import { assertEquals } from '@std/assert'
import { compile, items, name } from './todo.compile.ts'
import type { Section } from './todo.schema.ts'

// name

Deno.test('name — returns heading for named section', () => {
  assertEquals(name({ name: 'Work', items: [] }), {
    type: 'heading',
    depth: 2,
    children: [{ type: 'text', value: 'Work' }],
  })
})

Deno.test('name — returns null for empty name', () => {
  assertEquals(name({ name: '', items: [] }), null)
})

// items

Deno.test('items — returns list node from section items', () => {
  assertEquals(items({ name: 'Work', items: [{ content: 'fix bug', done: false }, { content: 'deploy', done: true }] }), {
    type: 'list',
    spread: false,
    children: [
      { type: 'listItem', checked: false, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'fix bug' }] }] },
      { type: 'listItem', checked: true, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'deploy' }] }] },
    ],
  })
})

Deno.test('items — returns null for empty items', () => {
  assertEquals(items({ name: 'Work', items: [] }), null)
})

// compile

Deno.test('compile — produces markdown from sections', () => {
  const sections: Section[] = [
    { name: 'Work', items: [{ content: 'fix bug', done: false }, { content: 'deploy', done: true }] },
    { name: 'Home', items: [{ content: 'groceries', done: false }] },
  ]

  assertEquals(compile(sections), '## Work\n\n- [ ] fix bug\n- [x] deploy\n\n## Home\n\n- [ ] groceries\n')
})
