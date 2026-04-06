import type { Norm, Strength } from './express.schema.ts'

const TEMPLATES: Record<Strength, (proposition: string) => string> = {
  obligatory: (proposition: string): string => proposition,
  forbidden: (proposition: string): string => `do not ${proposition}`,
  permissible: (proposition: string): string => `may ${proposition}`,
  optional: (proposition: string): string => `may choose to ${proposition}`,
  supererogatory: (proposition: string): string => `ideally ${proposition}`,
  indifferent: (proposition: string): string => `either way is fine for ${proposition}`,
  omissible: (proposition: string): string => `may omit ${proposition}`,
}

const renderNorm = (norm: Norm): string => {
  const template: (proposition: string) => string = TEMPLATES[norm.strength]
  return template(norm.proposition)
}

export const render = (norms: Norm[]): string[] => {
  return norms.map(renderNorm)
}
