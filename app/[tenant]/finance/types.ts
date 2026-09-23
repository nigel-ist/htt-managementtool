export type FinanceCategory = 'revenue' | 'expense' | 'investment' | 'grant' | 'other'
export type FinancePeriod = 'monthly' | 'quarterly' | 'annual' | 'one_time'

export interface FinanceEntry {
  id: string
  title: string
  category: FinanceCategory
  period: FinancePeriod
  amount: number
  currency: string
  entry_date: string
  description: string | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export const CATEGORY_META: Record<FinanceCategory, { label: string; color: string }> = {
  revenue:    { label: 'Revenue',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  expense:    { label: 'Expense',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  investment: { label: 'Investment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  grant:      { label: 'Grant',      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  other:      { label: 'Other',      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const PERIOD_META: Record<FinancePeriod, string> = {
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  annual:    'Annual',
  one_time:  'One-time',
}

export const FINANCE_CATEGORIES: FinanceCategory[] = ['revenue', 'expense', 'investment', 'grant', 'other']
export const FINANCE_PERIODS: FinancePeriod[] = ['monthly', 'quarterly', 'annual', 'one_time']
