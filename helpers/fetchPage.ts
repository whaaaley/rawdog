import { DOMParser } from '@b-fuze/deno-dom'
import { Readability } from '@mozilla/readability'

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const MAX_TEXT_LENGTH = 8000

// Fetch a URL and extract readable text content
// Uses Mozilla Readability, falls back to raw text extraction
export const fetchPage = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html',
      'DNT': '1',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Try Readability first
  const reader = new Readability(doc)
  const article = reader.parse()

  if (article?.textContent) {
    const text = article.textContent.trim()
    if (text.length > 0) {
      return text.slice(0, MAX_TEXT_LENGTH)
    }
  }

  // Fallback: strip tags and grab body text
  const body = doc.querySelector('body')
  if (!body) {
    throw new Error('No body element found')
  }

  // Remove script and style elements
  for (const el of body.querySelectorAll('script, style, nav, footer, header')) {
    el.remove()
  }

  const text = body.textContent.trim()

  if (text.length === 0) {
    throw new Error('No text content found')
  }

  return text.slice(0, MAX_TEXT_LENGTH)
}
