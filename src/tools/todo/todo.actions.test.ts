import { assertEquals } from '@std/assert'
import { add, check, edit, remove, uncheck } from './todo.actions.ts'
import type { Item } from './todo.schema.ts'

// check

Deno.test('check — marks items as done', () => {
  const items: Item[] = [
    { content: 'a', done: false },
    { content: 'b', done: false },
    { content: 'c', done: false },
  ]

  const result: Item[] = check(items, [0, 2])

  assertEquals(result, [
    { content: 'a', done: true },
    { content: 'b', done: false },
    { content: 'c', done: true },
  ])
})

// uncheck

Deno.test('uncheck — marks items as not done', () => {
  const items: Item[] = [
    { content: 'a', done: true },
    { content: 'b', done: true },
    { content: 'c', done: true },
  ]

  const result: Item[] = uncheck(items, [0, 2])

  assertEquals(result, [
    { content: 'a', done: false },
    { content: 'b', done: true },
    { content: 'c', done: false },
  ])
})

// add

Deno.test('add — inserts items at index', () => {
  const items: Item[] = [
    { content: 'a', done: false },
    { content: 'b', done: false },
  ]
  const newItems: Item[] = [
    { content: 'x', done: false },
    { content: 'y', done: true },
  ]

  const result: Item[] = add(items, 1, newItems)

  assertEquals(result, [
    { content: 'a', done: false },
    { content: 'x', done: false },
    { content: 'y', done: true },
    { content: 'b', done: false },
  ])
})

// edit

Deno.test('edit — replaces item content at index', () => {
  const items: Item[] = [
    { content: 'a', done: false },
    { content: 'b', done: true },
    { content: 'c', done: false },
  ]

  const result: Item[] = edit(items, 1, 'z')

  assertEquals(result, [
    { content: 'a', done: false },
    { content: 'z', done: true },
    { content: 'c', done: false },
  ])
})

// remove

Deno.test('remove — removes items by indices', () => {
  const items: Item[] = [
    { content: 'a', done: false },
    { content: 'b', done: true },
    { content: 'c', done: false },
  ]

  const result: Item[] = remove(items, [0, 2])

  assertEquals(result, [
    { content: 'b', done: true },
  ])
})
