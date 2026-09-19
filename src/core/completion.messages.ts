import type { MessageSchema } from './completion.schema.ts'

// Front placement is required, not tidiness: some chat templates raise rather than reorder when a system message
// arrives after the first turn.
// Bonsai 2 answers one with HTTP 500 and the Jinja error `System message must be at the beginning`.
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

  // Testing the first element matters: a lone system message is not necessarily a leading one, and the earlier
  // length-only check passed a trailing one straight through.
  if (systemParts.length === 1 && messages[0]?.role === 'system') {
    return messages
  }

  return [{ role: 'system', content: systemParts.join(' ') }, ...rest]
}
