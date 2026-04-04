const encoder: TextEncoder = new TextEncoder()

const write = (text: string): void => {
  Deno.stdout.writeSync(encoder.encode(text))
}

const moveTo = (current: number, target: number): void => {
  const delta: number = current - target
  if (delta > 0) write(`\x1b[${delta}A`)
  if (delta < 0) write(`\x1b[${-delta}B`)
}

const overwrite = (status: string, label: string): void => {
  write(`\r\x1b[K  ${status}  ${label}`)
}

type Tracker = {
  done: (index: number, status: number) => void
  empty: (index: number) => void
  fail: (index: number) => void
}

const tracker = (labels: string[]): Tracker => {
  const bottom: number = labels.length - 1

  labels.forEach((label) => {
    write(`  ...  ${label}\n`)
  })

  let cursor: number = bottom + 1

  const update = (index: number, status: string): void => {
    moveTo(cursor, index)
    overwrite(status, labels[index] ?? '')
    moveTo(index, bottom + 1)
    cursor = bottom + 1
  }

  return {
    done: (index: number, status: number): void => update(index, String(status)),
    empty: (index: number): void => update(index, '???'),
    fail: (index: number): void => update(index, '!!!'),
  }
}

export { tracker }
export type { Tracker }
