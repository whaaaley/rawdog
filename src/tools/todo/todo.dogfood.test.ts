import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { insert, route } from './todo.completions.ts'
import type { Insert, Route, Section } from './todo.schema.ts'

// fixtures matching the real TODO.md we were using during dogfooding

const sections: Section[] = [{
  name: 'server',
  items: [
    { content: 'build auth api', done: true },
    { content: 'write tests', done: false },
    { content: 'set up postgres', done: false },
  ],
}, {
  name: 'client',
  items: [
    { content: 'fix session handler', done: false },
    { content: 'integration tests', done: false },
    { content: 'e2e tests', done: false },
  ],
}]

// route — new section targeting

describe('route — new section', () => {
  it('routes to new section with multiple items in command', async () => {
    const result: Route = await route(sections, 'add "rewrite completion" and "wire edit into tool" to refactor')

    assertEquals(result.action, 'add')
    assertEquals(result.section, 'refactor')
  })


})

// route — section inference (no explicit section name in command)

describe('route — section inference', () => {
  it('infers server from item content', async () => {
    const result: Route = await route(sections, 'check write tests')

    assertEquals(result.action, 'check')
    assertEquals(result.section, 'server')
  })

  it('infers client from item content', async () => {
    const result: Route = await route(sections, 'remove e2e tests')

    assertEquals(result.action, 'remove')
    assertEquals(result.section, 'client')
  })

  it('infers section for add based on context', async () => {
    const result: Route = await route(sections, 'add redis cache')

    assertEquals(result.action, 'add')
    assertEquals(result.section, 'server')
  })
})

// insert — item extraction from complex commands

describe('insert — item extraction', () => {
  it('keeps quoted multi-word items intact', async () => {
    const result: Insert = await insert([], 'edit-action', 'add "edit schema and type" and "edit action" and "edit action test" to edit-action')

    assertEquals(result.items.length, 3)
  })

  it('extracts and-separated items', async () => {
    const result: Insert = await insert([], 'tasks', 'add login page and signup page and dashboard to tasks')

    assertEquals(result.items.length, 3)
  })

  it('extracts items from a long natural language command', async () => {
    const result: Insert = await insert([], 'backlog', 'add data masking, prompt injection guard, and token budget tracking to backlog')

    assertEquals(result.items.length, 3)
  })
})
