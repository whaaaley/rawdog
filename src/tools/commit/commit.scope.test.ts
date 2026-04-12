import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { parseNumstat, resolveScope } from './commit.scope.ts'

const scopes: string[] = [
  'auth',
  'billing',
  'dashboard',
  'editor',
  'api',
  'worker',
  'client',
  'server',
  'database',
  'ci',
  'build',
  'deploy',
  'config',
  'docker',
  'docs',
  'test',
  'tools',
  'scripts',
]

describe('resolveScope', () => {
  it('single file in a scope directory', () => {
    const files = [{ added: 10, removed: 5, file: 'packages/billing/src/pay.ts' }]
    assertEquals(resolveScope(files, scopes), 'billing')
  })

  it('root file with no matching segment', () => {
    const files = [{ added: 13, removed: 17, file: 'README.md' }]
    assertEquals(resolveScope(files, scopes), undefined)
  })

  it('root file with no directory at all', () => {
    const files = [{ added: 1, removed: 1, file: 'LICENSE' }]
    assertEquals(resolveScope(files, scopes), undefined)
  })

  it('picks first matching segment not the deepest', () => {
    // server/src/tools/auth/login.ts has both "server" and "auth"
    const files = [{ added: 5, removed: 3, file: 'server/src/tools/auth/login.ts' }]
    assertEquals(resolveScope(files, scopes), 'server')
  })

  it('heaviest scope wins across multiple files', () => {
    const files = [
      { added: 2, removed: 1, file: 'packages/auth/src/token.ts' },
      { added: 50, removed: 20, file: 'packages/billing/src/invoice.ts' },
      { added: 3, removed: 0, file: 'packages/auth/src/session.ts' },
    ]

    // auth: (2+1) + (3+0) = 6, billing: (50+20) = 70
    assertEquals(resolveScope(files, scopes), 'billing')
  })

  it('multiple files in same scope accumulate weight', () => {
    const files = [
      { added: 10, removed: 5, file: 'packages/dashboard/src/charts.tsx' },
      { added: 8, removed: 3, file: 'packages/dashboard/src/filters.tsx' },
      { added: 20, removed: 10, file: 'packages/editor/src/toolbar.tsx' },
    ]

    // dashboard: (10+5) + (8+3) = 26, editor: (20+10) = 30
    assertEquals(resolveScope(files, scopes), 'editor')
  })

  it('nested scope directory under non-scope parent', () => {
    const files = [{ added: 15, removed: 6, file: 'services/api/src/routes/users.ts' }]
    assertEquals(resolveScope(files, scopes), 'api')
  })

  it('docker-compose.yml does not match docker scope', () => {
    // filename contains "docker" but the segment is "docker-compose.yml"
    const files = [{ added: 3, removed: 2, file: 'docker-compose.yml' }]
    assertEquals(resolveScope(files, scopes), undefined)
  })

  it('file inside docker directory matches docker scope', () => {
    const files = [{ added: 5, removed: 0, file: 'docker/Dockerfile.dev' }]
    assertEquals(resolveScope(files, scopes), 'docker')
  })

  it('empty file list returns undefined', () => {
    assertEquals(resolveScope([], scopes), undefined)
  })

  it('zero-weight files still count', () => {
    // binary files or empty changes
    const files = [{ added: 0, removed: 0, file: 'packages/auth/src/icon.png' }]
    assertEquals(resolveScope(files, scopes), undefined)
  })

  it('ignores segments not in scope enum', () => {
    const files = [{ added: 5, removed: 5, file: 'packages/unknown/src/thing.ts' }]
    assertEquals(resolveScope(files, scopes), undefined)
  })

  it('tie breaks by first encountered', () => {
    const files = [
      { added: 10, removed: 0, file: 'packages/auth/src/login.ts' },
      { added: 10, removed: 0, file: 'packages/billing/src/pay.ts' },
    ]

    // both score 10, auth is encountered first
    assertEquals(resolveScope(files, scopes), 'auth')
  })
})

describe('parseNumstat', () => {
  it('parses standard numstat output', () => {
    const numstat = [
      '4\t3\tdeno.json',
      '51\t0\tsrc/tools/commit/commit.completions.ts',
    ].join('\n')

    assertEquals(parseNumstat(numstat), [
      { added: 4, removed: 3, file: 'deno.json' },
      { added: 51, removed: 0, file: 'src/tools/commit/commit.completions.ts' },
    ])
  })

  it('handles binary files with dash placeholders', () => {
    const numstat = '-\t-\tassets/logo.png'
    assertEquals(parseNumstat(numstat), [{ added: 0, removed: 0, file: 'assets/logo.png' }])
  })

  it('handles trailing newline', () => {
    const numstat = '10\t5\tsrc/index.ts\n'
    assertEquals(parseNumstat(numstat), [{ added: 10, removed: 5, file: 'src/index.ts' }])
  })

  it('handles empty string', () => {
    assertEquals(parseNumstat(''), [])
  })
})
