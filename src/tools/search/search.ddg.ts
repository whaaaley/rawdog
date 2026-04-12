import { DOMParser } from '@b-fuze/deno-dom'
import { searchResultSchema, type SearchResult } from './search.schema.ts'
import { config } from '../../core/config.ts'
import { getState, setState } from '../../core/state.ts'

// POST + form params + DNT header to avoid CAPTCHAs, derived from ddgr
// https://github.com/jarun/ddgr
const DDG_URL: string = config.research.ddgUrl
const USER_AGENT: string = config.research.userAgent
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

const extractNextParams = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const inputs = doc.querySelectorAll('input[name="nextParams"]')

  // ddgr logic: if two buttons exist, first is prev, second is next
  // if only one button exists (page 1), it's the next button
  const last = inputs[inputs.length - 1]
  return last?.getAttribute('value') ?? ''
}

const fetchPage1 = async (query: string): Promise<{ results: SearchResult[]; vqd: string; nextParams: string }> => {
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
  const nextParams = extractNextParams(html)

  return { results, vqd, nextParams }
}

const fetchPageN = async (query: string, page: number, vqd: string, nextParams: string): Promise<{ results: SearchResult[]; nextParams: string }> => {
  // ddgr formula: page 1 returns ~30 results, subsequent pages use 50-item offsets
  const s = 50 * (page - 1) + 30
  const dc = s + 1

  const res = await fetch(DDG_URL, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams({
      q: query,
      s: String(s),
      nextParams,
      v: 'l',
      o: 'json',
      dc: String(dc),
      api: '/d.js',
      vqd,
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
  const newNextParams = extractNextParams(html)

  return { results, nextParams: newNextParams }
}

export type DdgSearchResult = {
  results: SearchResult[]
  page: number
  offset: number
}

export const ddgSearch = async (query: string, page?: number): Promise<DdgSearchResult> => {
  // No page or page 1: fresh search, save vqd and nextParams
  if (!page || page === 1) {
    const { results, vqd, nextParams } = await fetchPage1(query)
    await setState(STATE_TOOL, query, { vqd, nextParams })

    return { results, page: 1, offset: 0 }
  }

  // Page 2+: read vqd and nextParams from state
  const cached = await getState(STATE_TOOL, query)

  if (!cached) {
    // No cached state, need to fetch page 1 first
    const { vqd, nextParams } = await fetchPage1(query)
    await setState(STATE_TOOL, query, { vqd, nextParams })
    const pageResult = await fetchPageN(query, page, vqd, nextParams)
    await setState(STATE_TOOL, query, { vqd, nextParams: pageResult.nextParams })
    const offset = 50 * (page - 1) + 30

    return { results: pageResult.results, page, offset }
  }

  const pageResult = await fetchPageN(query, page, cached.vqd, cached.nextParams ?? '')
  await setState(STATE_TOOL, query, { vqd: cached.vqd, nextParams: pageResult.nextParams })
  const offset = 50 * (page - 1) + 30

  return { results: pageResult.results, page, offset }
}
