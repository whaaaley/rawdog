import { assert, assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { indices, insert, rewrite, route } from './todo.completions.ts'
import type { Edit, Insert, Item, Route, Section } from './todo.schema.ts'

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

const serverItems: Item[] = sections[0]!.items
const clientItems: Item[] = sections[1]!.items

// route

describe('route', () => {
  it('routes check to correct section', async () => {
    const result: Route = await route(sections, 'check write tests in server')

    assertEquals(result.action, 'check')
    assertEquals(result.section, 'server')
  })

  it('routes add to correct section', async () => {
    const result: Route = await route(sections, 'add deploy pipeline to client')

    assertEquals(result.action, 'add')
    assertEquals(result.section, 'client')
  })

  it('routes remove to correct section', async () => {
    const result: Route = await route(sections, 'remove e2e tests from client')

    assertEquals(result.action, 'remove')
    assertEquals(result.section, 'client')
  })

  it('routes edit to correct section', async () => {
    const result: Route = await route(sections, 'change write tests to write unit tests in server')

    assertEquals(result.action, 'edit')
    assertEquals(result.section, 'server')
  })
})

// indices

describe('indices', () => {
  it('resolves single index by name', async () => {
    const result: number[] = await indices(serverItems, 'check write tests')

    assertEquals(result, [1])
  })

  it('resolves multiple indices', async () => {
    const result: number[] = await indices(clientItems, 'remove integration tests and e2e tests')

    assertEquals(result, [1, 2])
  })

  it('resolves index for first item', async () => {
    const result: number[] = await indices(serverItems, 'uncheck build auth api')

    assertEquals(result, [0])
  })
})

// insert

describe('insert', () => {
  it('inserts with valid index', async () => {
    const result: Insert = await insert(serverItems, 'server', 'add deploy pipeline to server')

    assertEquals(result.items.length, 1)
    assert(result.index >= 0 && result.index <= serverItems.length)
  })

  it('inserts multiple items', async () => {
    const result: Insert = await insert(clientItems, 'client', 'add login page and signup page to client')

    assertEquals(result.items.length, 2)
  })

  it('inserts before a specific item', async () => {
    const result: Insert = await insert(clientItems, 'client', 'add unit tests before integration tests in client')

    assertEquals(result.items.length, 1)
    assertEquals(result.index, 1)
  })
})

// rewrite

describe('rewrite', () => {
  it('rewrites item content', async () => {
    const result: Edit = await rewrite(serverItems, 'change write tests to write unit tests')

    assertEquals(result.index, 1)
    assertEquals(result.content, 'write unit tests')
  })

  it('rewrites first item', async () => {
    const result: Edit = await rewrite(clientItems, 'change fix session handler to fix OAuth handler')

    assertEquals(result.index, 0)
    assertEquals(result.content, 'fix OAuth handler')
  })

  it('rewrites with different phrasing', async () => {
    const result: Edit = await rewrite(clientItems, 'rename e2e tests to end-to-end tests')

    assertEquals(result.index, 2)
    assertEquals(result.content, 'end-to-end tests')
  })
})
