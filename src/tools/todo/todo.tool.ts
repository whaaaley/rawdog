#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

import { add, check, edit, remove, uncheck } from './todo.actions.ts'
import { compile } from './todo.compile.ts'
import { indices, insert, rewrite, route } from './todo.completions.ts'
import { parseDirect, resolveSection, validateIndices, type DirectCommand } from './todo.direct.ts'
import { load, save } from './todo.io.ts'
import type { Item, Section } from './todo.schema.ts'

const input = (): string | null => {
  const raw: string = Deno.args.join(' ')
  if (!raw) return null
  return raw
}

const list = (): void => {
  const sections: Section[] = load()
  if (sections.length === 0) return console.error('No items')
  console.log(compile(sections))
}

const command: string | null = input()
if (!command) {
  list()
  Deno.exit(0)
}

const sections: Section[] = load()
const direct: DirectCommand | null = parseDirect(command)

if (direct) {
  const section: Section | null = resolveSection(sections, direct.section)
  if (!section) {
    if (direct.section) {
      console.error(`Section "${direct.section}" not found`)
    } else {
      console.error('Multiple sections — specify section with "in <section>"')
    }
    Deno.exit(1)
  }

  const items: Item[] = section.items
  const outOfRange: number[] = validateIndices(direct.indices, items.length)
  if (outOfRange.length > 0) {
    console.error(`Index out of range: ${outOfRange.join(', ')} (list has ${items.length} items, 0–${items.length - 1})`)
    Deno.exit(1)
  }

  if (direct.action === 'check') section.items = check(items, direct.indices)
  if (direct.action === 'uncheck') section.items = uncheck(items, direct.indices)
  if (direct.action === 'remove') section.items = remove(items, direct.indices)

  save(sections)
  list()
  Deno.exit(0)
}

// LLM path — stage 1: route
const { action, section: sectionName } = await route(sections, command)

// find or create section
let section: Section | undefined = sections.find((s) => s.name === sectionName)
if (!section) {
  section = { name: sectionName, items: [] }
  sections.push(section)
}

const items: Item[] = section.items

// stage 2: per-action
if (action === 'check') {
  const idx: number[] = await indices(items, command)
  section.items = check(items, idx)
}

if (action === 'uncheck') {
  const idx: number[] = await indices(items, command)
  section.items = uncheck(items, idx)
}

if (action === 'add') {
  const { index, items: newItems } = await insert(items, sectionName, command)
  const newItemObjects: Item[] = newItems.map((text) => ({ content: text, done: false }))
  section.items = add(items, index, newItemObjects)
}

if (action === 'edit') {
  const { index, content } = await rewrite(items, command)
  section.items = edit(items, index, content)
}

if (action === 'remove') {
  const idx: number[] = await indices(items, command)
  section.items = remove(items, idx)
}

save(sections)
list()
