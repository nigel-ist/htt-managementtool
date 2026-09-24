export type ProductType = 'current' | 'proposed' | 'launch' | 'strategic_growth' | 'shelved'

export interface Product {
  id: string
  tenant_id: string
  type: ProductType
  name: string
  description: string | null
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export const TYPE_META: Record<ProductType, { label: string; color: string; description: string }> = {
  current:         { label: 'Current',          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',  description: 'Live products generating revenue' },
  proposed:        { label: 'Proposed',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',              description: 'Ideas under consideration' },
  launch:          { label: 'Launch',           color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',      description: 'Ready to launch or launching soon' },
  strategic_growth:{ label: 'Strategic Growth', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',          description: 'Targeted for growth investment' },
  shelved:         { label: 'Shelved',          color: 'bg-[rgb(var(--text-3))] bg-opacity-10 text-[rgb(var(--text-3))]',               description: 'Paused or discontinued' },
}

export const PRODUCT_TYPES: ProductType[] = ['current', 'proposed', 'launch', 'strategic_growth', 'shelved']
