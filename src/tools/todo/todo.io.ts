import { fromFileUrl, resolve } from '@std/path'
import { config } from '../../core/config.ts'
import { safe } from '../../utils/safe.utils.ts'
import { compile } from './todo.compile.ts'
import { parse } from './todo.parse.ts'
import type { Section } from './todo.schema.ts'

// fromFileUrl, not `new URL(...).pathname`, which leaves a space in the path as `%20` and fails the read.
const FILE: string = resolve(fromFileUrl(import.meta.url), '../../../../', config.todo.name)

export const load = (): Section[] => {
  const result = safe(() => Deno.readTextFileSync(FILE))

  if (result.error) return []

  return parse(result.data)
}

export const save = (sections: Section[]): void => {
  Deno.writeTextFileSync(FILE, compile(sections))
}
