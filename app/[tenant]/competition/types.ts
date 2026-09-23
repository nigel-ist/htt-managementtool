export type CompetitorTier = 'direct' | 'indirect' | 'emerging' | 'aspirational'

export interface Competitor {
  id: string
  name: string
  website: string | null
  tier: CompetitorTier
  summary: string | null
  strengths: string[]
  weaknesses: string[]
  notes: string | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export const TIER_META: Record<CompetitorTier, { label: string; color: string }> = {
  direct:       { label: 'Direct',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  indirect:     { label: 'Indirect',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  emerging:     { label: 'Emerging',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  aspirational: { label: 'Aspirational', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
}

export const COMPETITOR_TIERS: CompetitorTier[] = ['direct', 'indirect', 'emerging', 'aspirational']
