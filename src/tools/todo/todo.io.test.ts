import { assertEquals } from '@std/assert'
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd'
import { load, save } from './todo.io.ts'
import type { Section } from './todo.schema.ts'

const FILE: string = new URL('../../../TODO.md', import.meta.url).pathname

let backup: string | null = null

describe('todo.io', () => {
  beforeEach(() => {
    try {
      backup = Deno.readTextFileSync(FILE)
    } catch {
      backup = null
    }
  })

  afterEach(() => {
    if (backup !== null) {
      Deno.writeTextFileSync(FILE, backup)
    } else {
      try {
        Deno.removeSync(FILE)
      } catch { /* noop */ }
    }
  })

  // load

  it('load — parses sections from file', () => {
    Deno.writeTextFileSync(FILE, '## Work\n\n- [ ] fix bug\n- [x] deploy\n')

    const result: Section[] = load()

    assertEquals(result, [{
      name: 'Work',
      items: [
        { content: 'fix bug', done: false },
        { content: 'deploy', done: true },
      ],
    }])
  })

  it('load — returns empty for missing file', () => {
    try {
      Deno.removeSync(FILE)
    } catch { /* noop */ }

    const result: Section[] = load()

    assertEquals(result, [])
  })

  // save

  it('save — writes compiled markdown to file', () => {
    const sections: Section[] = [{
      name: 'Work',
      items: [
        { content: 'fix bug', done: false },
        { content: 'deploy', done: true },
      ],
    }]

    save(sections)

    const raw: string = Deno.readTextFileSync(FILE)
    assertEquals(raw, '## Work\n\n- [ ] fix bug\n- [x] deploy\n')
  })
})
