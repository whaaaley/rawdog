import { config } from '../../core/config.ts'
import { safe } from '../../utils/safe.utils.ts'
import { compile } from './todo.compile.ts'
import { parse } from './todo.parse.ts'
import type { Section } from './todo.schema.ts'

const FILE: string = new URL(`../../../${config.todo.name}`, import.meta.url).pathname

export const load = (): Section[] => {
  const result = safe(() => Deno.readTextFileSync(FILE))

  if (result.error) {
    return []
  }

  return parse(result.data)
}

export const save = (sections: Section[]): void => {
  Deno.writeTextFileSync(FILE, compile(sections))
}
