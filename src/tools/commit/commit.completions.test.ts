import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { generate } from './commit.completions.ts'
import type { CommitSchema } from './commit.schema.ts'

const types: string[] = ['feat', 'fix', 'migration', 'refactor', 'test', 'docs', 'style', 'chore', 'build', 'ci', 'perf', 'revert']

// type should be correct

describe('type assignment', () => {
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

    const result: CommitSchema = await generate({ diff, types, maxLength: 72 })

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

    const result: CommitSchema = await generate({ diff, types, maxLength: 72 })

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

    const result: CommitSchema = await generate({ diff, types, maxLength: 72 })

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

    const result: CommitSchema = await generate({ diff, types, maxLength: 72 })

    const validTypes = ['chore', 'build', 'ci']
    assertEquals(validTypes.includes(result.type), true, `expected chore/build/ci, got ${result.type}`)
  })

  it('license change is typed as docs or chore', async () => {
    const diff = `diff --git a/LICENSE b/LICENSE
index abc1234..def5678 100644
--- a/LICENSE
+++ b/LICENSE
@@ -1,4 +1,4 @@
 MIT License

-Copyright (c) 2024 Taskflow Inc
+Copyright (c) 2025 Taskflow Inc`

    const result: CommitSchema = await generate({ diff, types, maxLength: 72 })

    const validTypes = ['docs', 'chore']
    assertEquals(validTypes.includes(result.type), true, `expected docs/chore, got ${result.type}`)
  })
})

// scope should pass through from caller

describe('scope passthrough', () => {
  it('returns provided scope unchanged', async () => {
    const diff = `diff --git a/packages/billing/src/pay.ts b/packages/billing/src/pay.ts
index abc1234..def5678 100644
--- a/packages/billing/src/pay.ts
+++ b/packages/billing/src/pay.ts
@@ -10,6 +10,7 @@ export const processPayment = async (amount: number) => {
+  await validateAmount(amount)`

    const result: CommitSchema = await generate({ diff, types, scope: 'billing', maxLength: 72 })

    assertEquals(result.scope, 'billing')
  })

  it('returns undefined scope when none provided', async () => {
    const diff = `diff --git a/README.md b/README.md
index abc1234..def5678 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
-# Taskflow
+# Taskflow Monorepo`

    const result: CommitSchema = await generate({ diff, types, maxLength: 72 })

    assertEquals(result.scope, undefined)
  })
})
