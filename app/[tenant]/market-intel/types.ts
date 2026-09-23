export type IntelCategory = 'trend' | 'regulatory' | 'technology' | 'competitive' | 'customer' | 'other'

export interface MarketIntelEntry {
  id: string
  title: string
  category: IntelCategory
  source: string | null
  source_date: string | null
  body: string | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export const CATEGORY_META: Record<IntelCategory, { label: string; color: string }> = {
  trend:       { label: 'Trend',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  regulatory:  { label: 'Regulatory',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  technology:  { label: 'Technology',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  competitive: { label: 'Competitive', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  customer:    { label: 'Customer',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  other:       { label: 'Other',       color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const INTEL_CATEGORIES: IntelCategory[] = ['trend', 'regulatory', 'technology', 'competitive', 'customer', 'other']
