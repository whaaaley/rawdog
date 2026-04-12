import { assertEquals } from '@std/assert'
import { describe, it } from '@std/testing/bdd'
import { mergeSystemMessages } from './completion.messages.ts'
import type { MessageSchema } from './completion.schema.ts'

describe('mergeSystemMessages', () => {
  it('joins multiple system messages into one', () => {
    const messages: MessageSchema[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'system', content: 'Respond in JSON.' },
      { role: 'user', content: 'Hello' },
    ]

    assertEquals(mergeSystemMessages(messages), [
      { role: 'system', content: 'You are a helpful assistant. Respond in JSON.' },
      { role: 'user', content: 'Hello' },
    ])
  })

  it('returns original array when only one system message', () => {
    const messages: MessageSchema[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
    ]

    const result = mergeSystemMessages(messages)

    assertEquals(result, messages)
    // same reference, not a copy
    assertEquals(result === messages, true)
  })

  it('returns non-system messages when no system messages exist', () => {
    const messages: MessageSchema[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ]

    assertEquals(mergeSystemMessages(messages), [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ])
  })

  it('handles empty array', () => {
    assertEquals(mergeSystemMessages([]), [])
  })

  it('preserves order of non-system messages', () => {
    const messages: MessageSchema[] = [
      { role: 'system', content: 'First rule.' },
      { role: 'user', content: 'Question 1' },
      { role: 'assistant', content: 'Answer 1' },
      { role: 'system', content: 'Second rule.' },
      { role: 'user', content: 'Question 2' },
    ]

    assertEquals(mergeSystemMessages(messages), [
      { role: 'system', content: 'First rule. Second rule.' },
      { role: 'user', content: 'Question 1' },
      { role: 'assistant', content: 'Answer 1' },
      { role: 'user', content: 'Question 2' },
    ])
  })

  it('handles system-only messages', () => {
    const messages: MessageSchema[] = [
      { role: 'system', content: 'Rule one.' },
      { role: 'system', content: 'Rule two.' },
    ]

    assertEquals(mergeSystemMessages(messages), [
      { role: 'system', content: 'Rule one. Rule two.' },
    ])
  })

  it('handles single system message with no other messages', () => {
    const messages: MessageSchema[] = [
      { role: 'system', content: 'Only system.' },
    ]

    const result = mergeSystemMessages(messages)

    assertEquals(result, messages)
    assertEquals(result === messages, true)
  })
})
