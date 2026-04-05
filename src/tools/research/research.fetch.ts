import { DOMParser } from '@b-fuze/deno-dom'
import { Readability } from '@mozilla/readability'
import { config } from '../../core/config.ts'

const USER_AGENT: string = config.research.userAgent
const MAX_TEXT_LENGTH: number = config.research.maxTextLength

type FetchResult = {
  status: number
  text: string | null
}

export const fetchPage = async (url: string): Promise<FetchResult> => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html',
      'DNT': '1',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    return { status: res.status, text: null }
  }

  const status: number = res.status
  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Try Readability first
  const reader = new Readability(doc)
  const article = reader.parse()

  if (article?.textContent) {
    const text = article.textContent.trim()
    if (text.length > 0) {
      return { status, text: text.slice(0, MAX_TEXT_LENGTH) }
    }
  }

  // Fallback: strip tags and grab body text
  const body = doc.querySelector('body')
  if (!body) {
    return { status, text: null }
  }

  // Remove script and style elements
  for (const el of body.querySelectorAll('script, style, nav, footer, header')) {
    el.remove()
  }

  const text = body.textContent.trim()

  if (text.length === 0) {
    return { status, text: null }
  }

  return { status, text: text.slice(0, MAX_TEXT_LENGTH) }
}
