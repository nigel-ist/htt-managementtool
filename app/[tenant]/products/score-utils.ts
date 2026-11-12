import type { Product, ProductScores } from './types'

/**
 * Maps new data.scores keys → legacy flat-data keys used in imported backup products.
 */
const LEGACY_MAP: Partial<Record<keyof ProductScores, string>> = {
  brinkman_fit:      'overallHealth',
  opportunity:       'matrixX',
  competition:       'matrixY',
  skills:            'skillsScore',
  client:            'clientScore',
  client_predicted:  'clientPrediction',
  revenue:           'revenueScore',
  revenue_predicted: 'revenuePrediction',
}

function extractNum(v: unknown): number | undefined {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'overallScore' in v) {
    const n = (v as { overallScore: unknown }).overallScore
    if (typeof n === 'number') return n
  }
  return undefined
}

export function getScore(product: Product, key: keyof ProductScores): number | undefined {
  const d = product.data
  if (!d) return undefined

  const fromScores = extractNum((d.scores as Record<string, unknown> | undefined)?.[key])
  if (fromScores != null) return fromScores

  const legacyKey = LEGACY_MAP[key]
  if (legacyKey) {
    const fromLegacy = extractNum((d as unknown as Record<string, unknown>)[legacyKey])
    if (fromLegacy != null) return fromLegacy
  }

  return undefined
}

export function getBrinkmanFit(product: Product): number | undefined {
  return getScore(product, 'brinkman_fit')
}
