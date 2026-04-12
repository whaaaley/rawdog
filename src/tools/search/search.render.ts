import { normalizeBlurb } from './search.normalize.ts'
import type { SearchResult } from './search.schema.ts'

export const renderSearchResult = (result: SearchResult, index: number): string => {
  return `${index + 1}. ${result.title}
   ${result.url}
   ${normalizeBlurb(result.abstract)}`
}
