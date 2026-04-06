import { toMarkdown } from 'mdast-util-to-markdown'
import { gfmToMarkdown } from 'mdast-util-gfm'
import type { Heading, List, ListItem, Root, RootContent } from 'mdast'
import type { Section } from './todo.schema.ts'

export const name = (section: Section): Heading | null => {
  if (!section.name) return null

  return {
    type: 'heading',
    depth: 2,
    children: [{ type: 'text', value: section.name }],
  }
}

export const items = (section: Section): List | null => {
  if (section.items.length === 0) return null

  const result: ListItem[] = []

  for (const item of section.items) {
    result.push({
      type: 'listItem',
      checked: item.done,
      children: [{
        type: 'paragraph',
        children: [{ type: 'text', value: item.content }],
      }],
    })
  }

  return { type: 'list', spread: false, children: result }
}

export const compile = (sections: Section[]): string => {
  const children: RootContent[] = []

  for (const section of sections) {
    const heading: Heading | null = name(section)
    if (heading) children.push(heading)

    const list: List | null = items(section)
    if (list) children.push(list)
  }

  const root: Root = { type: 'root', children }

  return toMarkdown(root, {
    bullet: '-',
    extensions: [gfmToMarkdown()],
  })
}
