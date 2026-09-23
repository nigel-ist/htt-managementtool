export type RelationshipCategory = 'partner' | 'investor' | 'customer' | 'supplier' | 'advisor' | 'government' | 'other'

export interface Relationship {
  id: string
  name: string
  organisation: string | null
  category: RelationshipCategory
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export const CATEGORY_META: Record<RelationshipCategory, { label: string; color: string }> = {
  partner:    { label: 'Partner',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  investor:   { label: 'Investor',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  customer:   { label: 'Customer',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  supplier:   { label: 'Supplier',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  advisor:    { label: 'Advisor',    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  government: { label: 'Government', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  other:      { label: 'Other',      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const RELATIONSHIP_CATEGORIES: RelationshipCategory[] = ['partner', 'investor', 'customer', 'supplier', 'advisor', 'government', 'other']
