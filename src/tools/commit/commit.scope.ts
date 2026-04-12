type FileStat = {
  added: number
  removed: number
  file: string
}

// Find which scope enum value appears as a directory segment in changed file paths.
// Each file's weight is added + removed lines. Heaviest scope wins. No match → undefined.
export const resolveScope = (files: FileStat[], scopes: string[]): string | undefined => {
  const scopeSet = new Set(scopes)
  const scores: Record<string, number> = {}

  for (const { added, removed, file } of files) {
    const weight = added + removed
    const segments = file.split('/')

    for (const segment of segments) {
      if (scopeSet.has(segment)) {
        scores[segment] = (scores[segment] ?? 0) + weight
        break
      }
    }
  }

  let best: string | undefined
  let bestScore = 0

  for (const [scope, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = scope
      bestScore = score
    }
  }

  return best
}

// Parse git diff --numstat output into FileStat array.
export const parseNumstat = (numstat: string): FileStat[] => {
  const files: FileStat[] = []

  for (const line of numstat.split('\n')) {
    if (!line) {
      continue
    }

    const parts = line.split('\t')

    // Binary files show - for added/removed
    const added = parts[0] === '-' ? 0 : Number(parts[0])
    const removed = parts[1] === '-' ? 0 : Number(parts[1])
    const file = parts[2]

    if (!file) {
      continue
    }

    files.push({ added, removed, file })
  }

  return files
}
