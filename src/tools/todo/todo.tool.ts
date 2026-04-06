#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

import { add, check, edit, remove, uncheck } from './todo.actions.ts'
import { compile } from './todo.compile.ts'
import { indices, insert, rewrite, route } from './todo.completions.ts'
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

// stage 1: route
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
