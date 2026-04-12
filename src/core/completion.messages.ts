import type { MessageSchema } from './completion.schema.ts'

// Collapse all system messages into one. Preserves order of non-system messages. Multiple system messages get joined
// with a space separator and placed at the front. Returns the original array unchanged if there is zero or one system
// message already.
export const mergeSystemMessages = (messages: MessageSchema[]): MessageSchema[] => {
  const systemParts: string[] = []
  const rest: MessageSchema[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(msg.content)
    } else {
      rest.push(msg)
    }
  }

  // No system messages at all
  if (systemParts.length === 0) {
    return rest
  }

  // Already a single system message, return as-is
  if (systemParts.length === 1 && rest.length === messages.length - 1) {
    return messages
  }

  return [{ role: 'system', content: systemParts.join(' ') }, ...rest]
}
