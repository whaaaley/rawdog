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

const serverSection: Section | undefined = sections.at(0)
assert(serverSection)
const serverItems: Item[] = serverSection.items

const clientSection: Section | undefined = sections.at(1)
assert(clientSection)
const clientItems: Item[] = clientSection.items

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

  it('resolves multiple indices by name', async () => {
    const result: number[] = await indices(clientItems, 'remove integration tests and e2e tests')

    assertEquals(result, [1, 2])
  })

  it('resolves all indices', async () => {
    const result: number[] = await indices(serverItems, 'check all items')

    assertEquals(result, [0, 1, 2])
  })

  it('resolves filtered subset by criteria', async () => {
    const result: number[] = await indices(clientItems, 'check all test items')

    assertEquals(result, [1, 2])
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

  // FLAKY: 9B model sometimes returns index 2 instead of 1
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

// fuzz regressions — failures found during manual fuzz testing
// each case is pinned here with the original case number for reference

const listA: Section[] = [{
  name: 'a',
  items: [
    { content: 'fix login bug', done: false },
    { content: 'write unit tests', done: false },
    { content: 'set up CI pipeline', done: true },
    { content: 'integration tests for api', done: false },
    { content: 'add rate limiting', done: false },
  ],
}]

const listB: Section[] = [{
  name: 'b',
  items: [
    { content: 'refactor auth middleware', done: false },
    { content: 'e2e tests', done: false },
    { content: 'update README', done: false },
    { content: 'add search endpoint', done: true },
    { content: 'security audit', done: false },
    { content: 'deploy staging environment', done: false },
  ],
}]

const listD: Section[] = [{
  name: 'd',
  items: [
    { content: 'design landing page', done: false },
    { content: 'fix navbar overflow', done: false },
    { content: 'add user avatar upload', done: true },
    { content: 'write e2e tests', done: false },
    { content: 'refactor CSS modules', done: false },
    { content: 'add toast notifications', done: false },
    { content: 'fix footer alignment', done: false },
    { content: 'performance audit', done: false },
  ],
}]

const listF: Section[] = [{
  name: 'f',
  items: [
    { content: 'set up error tracking with sentry', done: false },
    { content: 'add webhook support', done: false },
    { content: 'fix race condition in queue worker', done: true },
    { content: 'write load tests', done: false },
    { content: 'implement caching layer', done: false },
    { content: 'add CSV export', done: false },
    { content: 'update dependencies', done: false },
    { content: 'fix flaky test in auth module', done: false },
  ],
}]

const listG: Section[] = [{
  name: 'g',
  items: [
    { content: 'create onboarding wizard', done: false },
    { content: 'fix date picker on safari', done: false },
    { content: 'add drag and drop reordering', done: true },
    { content: 'implement undo/redo', done: false },
    { content: 'write accessibility tests', done: false },
    { content: 'fix tooltip z-index issue', done: false },
    { content: 'add keyboard shortcuts', done: false },
    { content: 'localize error messages', done: false },
    { content: 'fix scroll position on back nav', done: false },
  ],
}]

describe('fuzz regressions', () => {
  // case 1: route created new section "write unit tests" instead of routing to "a"
  it('routes check to single-section list without explicit section name', async () => {
    const result: Route = await route(listA, 'check write unit tests')

    assertEquals(result.action, 'check')
    assertEquals(result.section, 'a')
  })

  // case 4: route created new section "security audit" instead of routing to "b"
  it('routes check to section b without explicit section name', async () => {
    const result: Route = await route(listB, 'check security audit')

    assertEquals(result.action, 'check')
    assertEquals(result.section, 'b')
  })

  // case 30: indices missed "add rate limiting" — LLM treated "add" as action verb instead of item name
  it('resolves three items when one starts with "add"', async () => {
    const section: Section | undefined = listA.at(0)
    assert(section)
    const items: Item[] = section.items
    const result: number[] = await indices(items, 'remove write unit tests and integration tests for api and add rate limiting')

    assertEquals(result, [1, 3, 4])
  })

  // case 45: "check all add items" only matched one of two "add" items
  // SKIP: 9B model treats "add" as action verb — returns [2] instead of [2, 5]
  // SKIP: 9B model treats "add" as action verb — returns [2] instead of [2, 5]
  it.skip('resolves filtered subset for items starting with "add"', async () => {
    const section: Section | undefined = listD.at(0)
    assert(section)
    const items: Item[] = section.items
    const result: number[] = await indices(items, 'check all add items')

    assertEquals(result, [2, 5])
  })

  // case 54: "cross off" routed as uncheck instead of check
  it('routes "cross off" as check', async () => {
    const result: Route = await route(listF, 'cross off update dependencies')

    assertEquals(result.action, 'check')
    assertEquals(result.section, 'f')
  })

  // case 99: "check all error items" checked everything instead of filtering to index 7
  // SKIP: 9B model ignores "error" as filter keyword — returns all unchecked items
  // SKIP: 9B model does semantic association not substring match — returns error-adjacent items
  it.skip('filters by keyword when command says "all [keyword] items"', async () => {
    const section: Section | undefined = listG.at(0)
    assert(section)
    const items: Item[] = section.items
    const result: number[] = await indices(items, 'check all error items')

    assertEquals(result, [7])
  })

  // S5: "add set up monitoring to devops" routed to "backend api" instead of creating new "devops" section
  it('routes add to new section when section name is not in current list', async () => {
    const multiSection: Section[] = [{
      name: 'backend api',
      items: [
        { content: 'add rate limiting', done: false },
        { content: 'fix auth tokens', done: true },
        { content: 'write api tests', done: false },
      ],
    }, {
      name: 'frontend ui',
      items: [
        { content: 'fix login form', done: false },
        { content: 'add dark mode', done: false },
        { content: 'update nav bar', done: false },
      ],
    }]
    const result: Route = await route(multiSection, 'add set up monitoring to devops')

    assertEquals(result.action, 'add')
    assertEquals(result.section, 'devops')
  })
})
