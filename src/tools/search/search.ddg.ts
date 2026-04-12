import { DOMParser } from '@b-fuze/deno-dom'
import { searchResultSchema, type SearchResult } from './search.schema.ts'
import { config } from '../../core/config.ts'
import { getState, setState } from '../../core/state.ts'

// POST + form params + DNT header to avoid CAPTCHAs, derived from ddgr
// https://github.com/jarun/ddgr
const DDG_URL: string = config.research.ddgUrl
const USER_AGENT: string = config.research.userAgent
export const PAGE_SIZE = 10
const STATE_TOOL = 'search' as const

const HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  'Accept-Encoding': 'gzip',
  'Content-Type': 'application/x-www-form-urlencoded',
  'DNT': '1',
}

const parseResults = (html: string): SearchResult[] => {
  if (html.includes('anomaly-modal') || html.includes('Please try again')) {
    throw new Error('DuckDuckGo returned a CAPTCHA')
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const links = doc.querySelectorAll('.result__a')
  const snippets = doc.querySelectorAll('.result__snippet')

  const results: SearchResult[] = []

  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    if (!link) {
      continue
    }

    const title = link.textContent.trim()
    const href = link.getAttribute('href') ?? ''
    const abstract = snippets[i]?.textContent.trim() ?? ''

    if (title && href) {
      results.push(searchResultSchema.parse({ title, url: href, abstract }))
    }
  }

  return results
}

const extractVqd = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const input = doc.querySelector('input[name="vqd"]')
  return input?.getAttribute('value') ?? ''
}

const fetchPage1 = async (query: string): Promise<{ results: SearchResult[]; vqd: string }> => {
  const res = await fetch(DDG_URL, {
    method: 'POST',
    headers: HEADERS,
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
  const results = parseResults(html)
  const vqd = extractVqd(html)

  return { results, vqd }
}

const fetchPageN = async (query: string, page: number, vqd: string): Promise<SearchResult[]> => {
  const offset = (page - 1) * PAGE_SIZE
  const dc = offset + 1

  const res = await fetch(DDG_URL, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams({
      q: query,
      s: String(offset),
      nextParams: '',
      v: 'l',
      o: 'json',
      dc: String(dc),
      api: 'd.js',
      vqd,
      k1: '-1',
      kl: 'us-en',
    }),
  })

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  return parseResults(html)
}

export type DdgSearchResult = {
  results: SearchResult[]
  page: number
  offset: number
}

export const ddgSearch = async (query: string, page?: number): Promise<DdgSearchResult> => {
  // No page or page 1: fresh search, save vqd
  if (!page || page === 1) {
    const { results, vqd } = await fetchPage1(query)
    await setState(STATE_TOOL, query, { vqd })

    return { results, page: 1, offset: 0 }
  }

  // Page 2+: read vqd from state
  const cached = await getState(STATE_TOOL, query)

  if (!cached) {
    // No cached vqd, need to fetch page 1 first
    const { vqd } = await fetchPage1(query)
    await setState(STATE_TOOL, query, { vqd })
    const results = await fetchPageN(query, page, vqd)
    const offset = (page - 1) * PAGE_SIZE

    return { results, page, offset }
  }

  const results = await fetchPageN(query, page, cached.vqd)
  const offset = (page - 1) * PAGE_SIZE

  return { results, page, offset }
}
