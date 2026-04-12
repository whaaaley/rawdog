import { z } from 'zod'
import { completion } from '../../core/completion.ts'
import { debug } from '../../utils/debug.utils.ts'
import { compile } from './todo.compile.ts'
import { editSchema, indicesSchema, insertSchema, routeSchema } from './todo.schema.ts'
import type { Edit, Insert, Item, Route, Section } from './todo.schema.ts'

const TEMPERATURE: number = 0.2
const META = { mode: 'loose' } as const
const SYSTEM: string = 'Return a JSON object matching the provided schema.'

const sectionList = (items: Item[]): string => {
  return items.map((item, i) => `${i} [${item.done ? 'x' : ' '}] ${item.content}`).join('\n')
}

export const route = async (sections: Section[], command: string): Promise<Route> => {
  const messages = [{
    role: 'system' as const,
    content: [
      'Return JSON with "action" and "section" fields.',
      'For check/uncheck/remove/edit: use the existing section containing the item.',
      'For add: use the section name from the command — the word after "to" or "in". It may be a new section not in the list.',
    ].join('\n'),
  }, {
    role: 'user' as const,
    content: `Current list:\n${sections.length === 0 ? '(empty)' : compile(sections)}\n\nCommand: ${command}`,
  }]

  const raw: string = await completion({
    messages,
    response_format: {
      type: 'json_object',
      schema: z.toJSONSchema(routeSchema),
    },
    temperature: TEMPERATURE,
    max_tokens: 64,
  }, META)

  debug('route', { messages, raw })
  return routeSchema.parse(JSON.parse(raw))
}

export const indices = async (items: Item[], command: string): Promise<number[]> => {
  const messages = [{
    role: 'system' as const,
    content: [
      SYSTEM,
      'Return indices of the items the command refers to.',
      '"and" separates item names. Words like "add", "fix", "write" can be part of an item name.',
    ].join('\n'),
  }, {
    role: 'user' as const,
    content: `Current list:\n${sectionList(items)}\n\nCommand: ${command}`,
  }]

  const raw: string = await completion({
    messages,
    response_format: {
      type: 'json_object',
      schema: z.toJSONSchema(indicesSchema),
    },
    temperature: TEMPERATURE,
    max_tokens: 128,
  }, META)

  debug('indices', { messages, raw })
  return indicesSchema.parse(JSON.parse(raw)).indices
}

export const insert = async (items: Item[], sectionName: string, command: string): Promise<Insert> => {
  const extractMessages = [{
    role: 'system' as const,
    content: [
      'Extract the task names from the command, one per line.',
      `Section: "${sectionName}".`,
    ].join(' '),
  }, {
    role: 'user' as const,
    content: command,
  }]

  const extracted: string = await completion({
    messages: extractMessages,
    temperature: TEMPERATURE,
    max_tokens: 512,
  }, META)

  debug('insert:extract', { messages: extractMessages, raw: extracted })

  const positionMessages = [{
    role: 'system' as const,
    content: SYSTEM,
  }, {
    role: 'user' as const,
    content: `Current list:\n${sectionList(items)}\n\nNew tasks to insert:\n${extracted}\n\nOriginal command: ${command}`,
  }]

  const raw: string = await completion({
    messages: positionMessages,
    response_format: {
      type: 'json_object',
      schema: z.toJSONSchema(insertSchema),
    },
    temperature: TEMPERATURE,
    max_tokens: 512,
  }, META)

  debug('insert:position', { messages: positionMessages, raw })
  return insertSchema.parse(JSON.parse(raw))
}

export const rewrite = async (items: Item[], command: string): Promise<Edit> => {
  const messages = [{
    role: 'system' as const,
    content: SYSTEM,
  }, {
    role: 'user' as const,
    content: `Current list:\n${sectionList(items)}\n\nCommand: ${command}`,
  }]

  const raw: string = await completion({
    messages,
    response_format: {
      type: 'json_object',
      schema: z.toJSONSchema(editSchema),
    },
    temperature: TEMPERATURE,
    max_tokens: 256,
  }, META)

  debug('rewrite', { messages, raw })
  return editSchema.parse(JSON.parse(raw))
}
