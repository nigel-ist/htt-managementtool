/**
 * Current State module — shared types and dimension definitions.
 * No 'use server' directive — safe to import in both server and client code.
 */

// ─── Types ────────────────────────────────────────────────────────

export interface DimensionScore {
  category: string
  dimension: string
  score: number
  notes?: string | null
}

export interface CurrentStateData {
  scores: DimensionScore[]
  updatedAt: string | null
}

// ─── Dimension definitions ────────────────────────────────────────

export const CATEGORIES = [
  {
    key: 'strategic',
    label: 'Strategic',
    dimensions: [
      'Vision Clarity',
      'Market Position',
      'Competitive Advantage',
      'Strategic Alignment',
      'Growth Strategy',
    ],
  },
  {
    key: 'operational',
    label: 'Operational',
    dimensions: [
      'Process Efficiency',
      'Team Capability',
      'Technology & Systems',
      'Resource Allocation',
      'Execution Quality',
    ],
  },
  {
    key: 'financial',
    label: 'Financial',
    dimensions: [
      'Revenue Health',
      'Cost Management',
      'Cash Flow',
      'Profitability',
      'Financial Planning',
    ],
  },
]
