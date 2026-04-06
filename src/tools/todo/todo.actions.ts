import type { Item } from './todo.schema.ts'

export const check = (items: Item[], indices: number[]): Item[] => {
  const set: Set<number> = new Set(indices)
  return items.map((item, i) => set.has(i) ? { ...item, done: true } : item)
}

export const uncheck = (items: Item[], indices: number[]): Item[] => {
  const set: Set<number> = new Set(indices)
  return items.map((item, i) => set.has(i) ? { ...item, done: false } : item)
}

export const add = (items: Item[], index: number, newItems: Item[]): Item[] => {
  return [...items.slice(0, index), ...newItems, ...items.slice(index)]
}

export const edit = (items: Item[], index: number, content: string): Item[] => {
  return items.map((item, i) => i === index ? { ...item, content } : item)
}

export const remove = (items: Item[], indices: number[]): Item[] => {
  const set: Set<number> = new Set(indices)
  return items.filter((_, i) => !set.has(i))
}
