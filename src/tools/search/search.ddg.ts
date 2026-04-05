import { DOMParser } from '@b-fuze/deno-dom'
import { searchResultSchema } from './search.schema.ts'
import type { SearchResult } from './search.schema.ts'
import { config } from '../../core/config.ts'

// POST + form params + DNT header to avoid CAPTCHAs, derived from ddgr
// https://github.com/jarun/ddgr
const DDG_URL: string = config.research.ddgUrl
const USER_AGENT: string = config.research.userAgent

export const ddgSearch = async (query: string): Promise<SearchResult[]> => {
  const res = await fetch(DDG_URL, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Encoding': 'gzip',
      'Content-Type': 'application/x-www-form-urlencoded',
      'DNT': '1',
    },
    body: new URLSearchParams({
      q: query,
      b: '',
      kf: '-1',
      kh: '1',
      kl: 'us-en',
      kp: '1',
      k1: '-1',
    }),
  })

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }

  const html = await res.text()

  if (html.includes('anomaly-modal') || html.includes('Please try again')) {
    throw new Error('DuckDuckGo returned a CAPTCHA')
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const links = doc.querySelectorAll('.result__a')
  const snippets = doc.querySelectorAll('.result__snippet')

  const results: SearchResult[] = []

  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    if (!link) continue

    const title = link.textContent.trim()
    const href = link.getAttribute('href') ?? ''
    const abstract = snippets[i]?.textContent.trim() ?? ''

    if (title && href) {
      results.push(searchResultSchema.parse({ title, url: href, abstract }))
    }
  }

  return results
}
