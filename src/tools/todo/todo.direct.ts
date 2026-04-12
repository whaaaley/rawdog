import type { Route, Section } from './todo.schema.ts'

type Action = Route['action']

const DIRECT_ACTIONS: Set<string> = new Set(['check', 'uncheck', 'remove'])

export interface DirectCommand {
  action: Action
  indices: number[]
  section: string | null
}

export const parseIndices = (raw: string): number[] | null => {
  const parts: string[] = raw.split(',')
  const nums: number[] = []
  for (const part of parts) {
    const trimmed: string = part.trim()
    if (trimmed === '' || !/^\d+$/.test(trimmed)) return null
    nums.push(Number(trimmed))
  }
  return nums.length > 0 ? nums : null
}

export const parseDirect = (command: string): DirectCommand | null => {
  const words: string[] = command.trim().split(/\s+/)
  if (words.length < 2) return null

  const action: string | undefined = words.at(0)
  if (!action || !DIRECT_ACTIONS.has(action)) return null

  const indicesRaw: string | undefined = words.at(1)
  if (!indicesRaw) return null

  const idx: number[] | null = parseIndices(indicesRaw)
  if (!idx) return null

  // check for "in <section>" after the indices
  let section: string | null = null
  if (words.length >= 4 && words.at(2) === 'in') {
    section = words.slice(3).join(' ')
  } else if (words.length > 3) {
    // extra words that aren't "in <section>" — not a direct command
    return null
  }

  return { action: action as Action, indices: idx, section }
}

export const validateIndices = (indices: number[], itemCount: number): number[] => {
  return indices.filter((i) => i < 0 || i >= itemCount)
}

export const resolveSection = (sections: Section[], sectionName: string | null): Section | null => {
  if (sectionName) {
    return sections.find((s) => s.name === sectionName) ?? null
  }
  if (sections.length === 1) {
    const only: Section | undefined = sections.at(0)
    return only ?? null
  }
  return null
}
