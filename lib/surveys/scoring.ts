import type { Survey, SurveyResponse, SurveyScoreConfig, SurveyBand } from '@/app/[tenant]/surveys/types'

// ── Types ─────────────────────────────────────────────────────────────────

export interface SubscaleResult {
  id: string
  name: string
  raw: number
  normalized: number | null
  band: SurveyBand | null
}

export interface SurveyScoreResult {
  subscales: SubscaleResult[]
  composite: number | null
  compositeBand: SurveyBand | null
  higher_order: Record<string, number>
}

// ── Reverse scoring ────────────────────────────────────────────────────────

function reverseScore(value: number, type: string): number {
  if (type === 'likert5') return 6 - value   // 1-5 scale → reversed
  if (type === 'likert6') return 7 - value   // 1-6 scale → reversed
  if (type === 'rating')  return 11 - value  // 1-10 scale → reversed
  return value
}

// ── Band lookup ────────────────────────────────────────────────────────────

function findBand(bands: SurveyBand[], subscaleId: string, score: number): SurveyBand | null {
  return bands.find(b => b.subscale_id === subscaleId && score >= b.min && score <= b.max) ?? null
}

// ── Main scoring function ─────────────────────────────────────────────────

export function computeScores(survey: Survey, response: SurveyResponse): SurveyScoreResult | null {
  const config: SurveyScoreConfig | null = survey.scoring_config
  if (!config) return null

  const qMap = Object.fromEntries(survey.questions.map(q => [q.id, q]))

  // Score each subscale
  const subscales: SubscaleResult[] = config.subscales.map(sub => {
    let raw = 0
    let count = 0

    for (const qid of sub.question_ids) {
      const q = qMap[qid]
      if (!q) continue

      if (q.type === 'multichoice') {
        // Binary: 1 if correct answer matches, 0 otherwise
        const correct = config.answer_keys?.[qid]
        const given = response.data[qid]
        if (correct !== undefined && given !== undefined) {
          raw += given === correct ? 1 : 0
          count++
        }
      } else {
        const raw_val = parseFloat(response.data[qid] ?? '')
        if (isNaN(raw_val)) continue

        const scored = q.reverse_scored ? reverseScore(raw_val, q.type) : raw_val
        raw += scored
        count++
      }
    }

    const normalize = sub.normalize !== false
    const normalized = normalize && count > 0
      ? Math.round(((raw - sub.raw_min) / (sub.raw_max - sub.raw_min)) * 100 * 10) / 10
      : null

    const scoreForBand = normalized ?? raw
    const band = findBand(config.bands, sub.id, scoreForBand)

    return { id: sub.id, name: sub.name, raw, normalized, band }
  })

  // Composite
  let composite: number | null = null
  let compositeBand: SurveyBand | null = null
  if (config.composite) {
    const subMap = Object.fromEntries(subscales.map(s => [s.id, s]))
    let total = 0
    let totalWeight = 0
    for (const [sid, weight] of Object.entries(config.composite.weights)) {
      const sub = subMap[sid]
      if (!sub) continue
      const score = sub.normalized ?? sub.raw
      total += score * weight
      totalWeight += weight
    }
    if (totalWeight > 0) {
      composite = Math.round((total / totalWeight) * 10) / 10
      compositeBand = findBand(config.bands, 'composite', composite)
    }
  }

  // Higher-order groupings (raw sums, e.g. Schwartz higher-order values)
  const higher_order: Record<string, number> = {}
  if (config.higher_order) {
    const subMap = Object.fromEntries(subscales.map(s => [s.id, s]))
    for (const [groupName, subIds] of Object.entries(config.higher_order)) {
      const sum = subIds.reduce((acc, sid) => acc + (subMap[sid]?.raw ?? 0), 0)
      higher_order[groupName] = sum
    }
  }

  return { subscales, composite, compositeBand, higher_order }
}

// ── Band color helper ──────────────────────────────────────────────────────

export function bandColorClass(bandLabel: string): string {
  const l = bandLabel.toLowerCase()
  if (l.includes('expert') || l.includes('fluid') || l.includes('high') || l.includes('applied practitioner')) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
  if (l.includes('engaged') || l.includes('applied') || l.includes('moderate')) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  if (l.includes('contextual') || l.includes('foundational') || l.includes('awareness')) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  if (l.includes('intuitive') || l.includes('anchored') || l.includes('low') || l.includes('minimal')) return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  return 'text-[rgb(var(--text-1))] bg-[rgb(var(--surface))] border-[rgb(var(--border))]'
}
