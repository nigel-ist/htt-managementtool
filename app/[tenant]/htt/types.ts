/**
 * HTT shared types, constants, and pure utilities.
 * No 'use server' — safe to import in both Server and Client components.
 */

export const HTT_CAPABILITIES = [
  'critical_thinking',
  'mental_models',
  'perspective_taking',
  'adaptability',
  'independence',
  'creativity',
] as const

export type HttCapability = typeof HTT_CAPABILITIES[number]

export interface CapabilityScores {
  critical_thinking: number
  mental_models: number
  perspective_taking: number
  adaptability: number
  independence: number
  creativity: number
}

export interface HttBaseline {
  id: string
  stage: number
  scores: CapabilityScores
  source: string
  assessed_at: string
}

/**
 * Derive an overall HTT stage (1–5) from the mean of capability scores.
 *
 * Mean 1.0–1.6 → Stage 1 (Acquisition)
 * Mean 1.7–2.4 → Stage 2 (Fluency)
 * Mean 2.5–3.2 → Stage 3 (Maintenance)
 * Mean 3.3–4.0 → Stage 4 (Generalisation)
 * Mean 4.1–5.0 → Stage 5 (Adaptive)
 */
export function deriveStage(scores: CapabilityScores): number {
  const values = Object.values(scores)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 1.6) return 1
  if (mean <= 2.4) return 2
  if (mean <= 3.2) return 3
  if (mean <= 4.0) return 4
  return 5
}
