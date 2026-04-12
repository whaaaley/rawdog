type PaginationOptions = {
  total: number
  count: number
  limit?: number
  offset?: number
}

export const formatHeader = (label: string, options: PaginationOptions): string => {
  const { total, count, limit } = options
  const offset = options.offset ?? 0

  if (count === 0) {
    return label + ' (0 results)'
  }

  const start = offset + 1
  const end = offset + count
  const pageSize = limit ?? count
  const page = pageSize > 0 ? Math.floor(offset / pageSize) + 1 : 1

  return label + ' (showing ' + start + '-' + end + ' of ' + total + ', page ' + page + ')'
}

type FormatResultsOptions<T> = {
  label: string
  items: Array<T>
  total: number
  limit?: number
  offset?: number
  renderItem: (item: T, index: number) => string
}

export const formatResults = <T>(options: FormatResultsOptions<T>): string => {
  const { label, items, total, limit, offset, renderItem } = options

  const header = formatHeader(label, { total, count: items.length, limit, offset })

  if (items.length === 0) {
    return header
  }

  const body = items
    .map((item, i) => renderItem(item, i))
    .join('\n\n')

  return header + '\n\n' + body
}
