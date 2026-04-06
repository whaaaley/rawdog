import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import type { BlockContent, DefinitionContent, PhrasingContent, Root, RootContent } from 'mdast'
import type { Item, Section } from './todo.schema.ts'

export const name = (node: RootContent): string | null => {
  if (node.type !== 'heading' || node.depth !== 2) return null

  const [text]: PhrasingContent[] = node.children
  if (text && text.type === 'text') return text.value

  return null
}

export const items = (node: RootContent): Item[] => {
  if (node.type !== 'list') return []

  const result: Item[] = []

  for (const li of node.children) {
    const [paragraph]: (BlockContent | DefinitionContent)[] = li.children
    if (!paragraph || paragraph.type !== 'paragraph') continue

    const [text]: PhrasingContent[] = paragraph.children
    if (text && text.type === 'text') {
      result.push({ content: text.value, done: li.checked === true })
    }
  }

  return result
}

export const parse = (raw: string): Section[] => {
  const tree: Root = fromMarkdown(raw, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })

  const sections: Section[] = []

  for (const node of tree.children) {
    const heading: string | null = name(node)

    if (heading !== null) {
      sections.push({ name: heading, items: [] })
      continue
    }

    const collected: Item[] = items(node)
    if (collected.length === 0) continue

    const prev: Section | undefined = sections[sections.length - 1]
    if (!prev) continue

    prev.items.push(...collected)
  }

  return sections
}
