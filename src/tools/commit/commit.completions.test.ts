import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { DEFAULT_TYPES, type CommitItem } from '../../core/config.schema.ts'
import { classifyType, classifyScope, generateDescription } from './commit.completions.ts'

const types: CommitItem[] = [
  ...DEFAULT_TYPES,
  { name: 'migration', description: 'Database migration changes' },
]

const scopes: CommitItem[] = [
  { name: 'api', description: 'Backend API routes and handlers' },
  { name: 'ui', description: 'Frontend UI components and views' },
  { name: 'cli', description: 'Command-line interface tools' },
  { name: 'server', description: 'Server-side application code' },
  { name: 'client', description: 'Client-side application code' },
  { name: 'docker', description: 'Docker configuration and container files' },
]

// Helper: run full desc-first pipeline for a diff
const pipeline = async (diff: string, hint?: string): Promise<{ type: string; description: string }> => {
  const description = await generateDescription({ diff, maxLength: 72, hint })
  const type = await classifyType({ diff, description, types, hint })

  return { type, description }
}

// classifyType (desc-first pipeline)

describe('classifyType', () => {
  it('markdown-only change is typed as docs', async () => {
    const diff = `diff --git a/docs/architecture.md b/docs/architecture.md
index abc1234..def5678 100644
--- a/docs/architecture.md
+++ b/docs/architecture.md
@@ -1,5 +1,5 @@
-# Architecture
+# Platform Architecture

-Taskflow is a modular web platform.
+Taskflow is a modular full-stack web platform.`

    const result = await pipeline(diff)

    assertEquals(result.type, 'docs')
  })

  it('test file change is typed as test', async () => {
    const diff = `diff --git a/services/api/src/routes/users.test.ts b/services/api/src/routes/users.test.ts
index abc1234..def5678 100644
--- a/services/api/src/routes/users.test.ts
+++ b/services/api/src/routes/users.test.ts
@@ -50,6 +50,26 @@ describe('users', () => {
+  it('should create a team member', async () => {
+    const result = await caller.users.create({
+      name: 'Jane Doe',
+      role: 'member',
+      team: 'engineering',
+    })
+    assertEquals(result.role, 'member')
+  })`

    const result = await pipeline(diff)

    assertEquals(result.type, 'test')
  })

  it('feature code change is not typed as docs', async () => {
    const diff = `diff --git a/packages/dashboard/src/views/AnalyticsView.tsx b/packages/dashboard/src/views/AnalyticsView.tsx
index abc1234..def5678 100644
--- a/packages/dashboard/src/views/AnalyticsView.tsx
+++ b/packages/dashboard/src/views/AnalyticsView.tsx
@@ -45,10 +45,15 @@ export const AnalyticsView = () => {
-  const metrics = data.value?.items ?? []
+  const metrics = computed(() => data.value?.items ?? [])
+  const isEmpty = computed(() => metrics.value.length === 0)
+
+  const handleRefresh = async () => {
+    await refetch()
+  }`

    const result = await pipeline(diff)

    const invalidTypes = ['docs', 'test', 'ci', 'build']
    assertEquals(invalidTypes.includes(result.type), false, `expected non-docs type, got ${result.type}`)
  })

  it('config file change is typed as chore or build', async () => {
    const diff = `diff --git a/docker-compose.yml b/docker-compose.yml
index abc1234..def5678 100644
--- a/docker-compose.yml
+++ b/docker-compose.yml
@@ -10,7 +10,8 @@ services:
   app:
     build: .
-    ports:
-      - "3000:3000"
+    ports:
+      - "3002:3002"
+      - "5001:5001"`

    const result = await pipeline(diff)

    const validTypes = ['chore', 'build', 'ci']
    assertEquals(validTypes.includes(result.type), true, `expected chore/build/ci, got ${result.type}`)
  })

  it('deleted infrastructure file is typed as chore', async () => {
    const diff = `diff --git a/docker/sandbox/entrypoint.sh b/docker/sandbox/entrypoint.sh
deleted file mode 100644
index abc1234..0000000
--- a/docker/sandbox/entrypoint.sh
+++ /dev/null
@@ -1,12 +0,0 @@
-#!/bin/bash
-set -e
-
-echo "Starting sandbox..."
-deno run -A --watch index.ts &
-npm run dev -- --host &
-wait -n
-exit $?`

    const result = await pipeline(diff)

    const validTypes = ['chore', 'build', 'ci']
    assertEquals(validTypes.includes(result.type), true, `expected chore/build/ci, got ${result.type}`)
  })

  it('hint overrides type classification', async () => {
    // This diff naturally classifies as docs - hint should override to chore
    const diff = `diff --git a/docs/architecture.md b/docs/architecture.md
index abc1234..def5678 100644
--- a/docs/architecture.md
+++ b/docs/architecture.md
@@ -1,5 +1,5 @@
-# Architecture
+# Platform Architecture

-Taskflow is a modular web platform.
+Taskflow is a modular full-stack web platform.`

    const result = await pipeline(diff, 'chore')

    assertEquals(result.type, 'chore')
  })

  it('ci workflow change is typed as ci', async () => {
    const diff = `diff --git a/.github/workflows/deploy.yaml b/.github/workflows/deploy.yaml
index abc1234..def5678 100644
--- a/.github/workflows/deploy.yaml
+++ b/.github/workflows/deploy.yaml
@@ -15,6 +15,9 @@ on:
   push:
     branches: [main]

+concurrency:
+  group: deploy
+  cancel-in-progress: true
+
 jobs:
   deploy:`

    const result = await pipeline(diff)

    assertEquals(result.type, 'ci')
  })
})

// classifyScope

describe('classifyScope', () => {
  it('returns matching scope from file path', async () => {
    const diff = `diff --git a/server/src/apps/governance/agenda/agenda.queries.ts b/server/src/apps/governance/agenda/agenda.queries.ts
index abc1234..def5678 100644
--- a/server/src/apps/governance/agenda/agenda.queries.ts
+++ b/server/src/apps/governance/agenda/agenda.queries.ts
@@ -10,6 +10,7 @@ export const createAgenda = async (input: CreateInput) => {
+  priority: input.priority,`

    const description = await generateDescription({ diff, maxLength: 72 })
    const result = await classifyScope({ diff, description, scopes })

    assertEquals(result, 'server')
  })

  it('returns null when no scopes configured', async () => {
    const diff = `diff --git a/server/src/apps/governance/agenda/agenda.queries.ts b/server/src/apps/governance/agenda/agenda.queries.ts
index abc1234..def5678 100644
--- a/server/src/apps/governance/agenda/agenda.queries.ts
+++ b/server/src/apps/governance/agenda/agenda.queries.ts
@@ -10,6 +10,7 @@ export const createAgenda = async (input: CreateInput) => {
+  priority: input.priority,`

    const result = await classifyScope({ diff, description: 'add priority field', scopes: [] })

    assertEquals(result, null)
  })

  it('returns null when no scope matches', async () => {
    const diff = `diff --git a/README.md b/README.md
index abc1234..def5678 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
-# Taskflow
+# Taskflow Monorepo`

    const description = await generateDescription({ diff, maxLength: 72 })
    const result = await classifyScope({ diff, description, scopes })

    assertEquals(result, null)
  })

  it('returns docker scope for docker files', async () => {
    const diff = `diff --git a/docker/sandbox/entrypoint.sh b/docker/sandbox/entrypoint.sh
deleted file mode 100644
index abc1234..0000000
--- a/docker/sandbox/entrypoint.sh
+++ /dev/null
@@ -1,5 +0,0 @@
-#!/bin/bash
-set -e
-echo "Starting sandbox..."
-deno run -A --watch index.ts &
-wait -n`

    const description = await generateDescription({ diff, maxLength: 72 })
    const result = await classifyScope({ diff, description, scopes })

    assertEquals(result, 'docker')
  })
})

// regression tests from commit1

describe('regression (from commit v1)', () => {
  it('license change is typed as docs or chore', async () => {
    const diff = `diff --git a/LICENSE b/LICENSE
index abc1234..def5678 100644
--- a/LICENSE
+++ b/LICENSE
@@ -1,4 +1,4 @@
 MIT License

-Copyright (c) 2024 Taskflow Inc
+Copyright (c) 2025 Taskflow Inc`

    const result = await pipeline(diff)

    const validTypes = ['docs', 'chore']
    assertEquals(validTypes.includes(result.type), true, `expected docs/chore, got ${result.type}`)
  })
})

// generateDescription

describe('generateDescription', () => {
  it('generates a lowercase imperative description', async () => {
    const diff = `diff --git a/packages/dashboard/src/views/AnalyticsView.tsx b/packages/dashboard/src/views/AnalyticsView.tsx
index abc1234..def5678 100644
--- a/packages/dashboard/src/views/AnalyticsView.tsx
+++ b/packages/dashboard/src/views/AnalyticsView.tsx
@@ -45,10 +45,15 @@ export const AnalyticsView = () => {
-  const metrics = data.value?.items ?? []
+  const metrics = computed(() => data.value?.items ?? [])
+  const isEmpty = computed(() => metrics.value.length === 0)
+
+  const handleRefresh = async () => {
+    await refetch()
+  }`

    const result = await generateDescription({ diff, maxLength: 72 })

    // Should start with lowercase letter
    assertEquals(/^[a-z]/.test(result), true, `expected lowercase start, got "${result}"`)

    // Should not end with period
    assertEquals(result.endsWith('.'), false, `expected no trailing period, got "${result}"`)

    // Production retries if over maxLength * 1.25, so descriptions up to 90 chars can pass through
    assertEquals(result.length <= 72 * 1.25, true, `description too long: ${result.length} chars`)
  })
})
