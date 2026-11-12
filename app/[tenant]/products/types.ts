export type ProductType = 'current' | 'proposed' | 'launch' | 'strategic_growth' | 'shelved'

export interface PricingTier {
  label: string
  price: string
}

export interface ProductScores {
  brinkman_fit: number        // 0-100 hero score
  skills: number              // 0-100
  bc_readiness: number        // 0-100
  client: number              // 0-100
  client_predicted: number    // 0-100
  revenue: number             // 0-100
  revenue_predicted: number   // 0-100
  market: number              // 0-100
  opportunity: number         // 0-100 (X axis of matrix)
  competition: number         // 0-100 (Y axis = competitive advantage)
  consensus: number           // 0-100
  forecast_1yr: number        // 0-100
  forecast_3yr: number        // 0-100
  forecast_5yr: number        // 0-100
}

export interface ProductData {
  features: string[]
  deliverables: string[]
  differentiators: string[]
  pricing: PricingTier[]
  pricing_notes: string
  business_units: string[]    // BRL | BLI | BER | BG
  category_tags: string[]     // A | B | C | D
  scores: Partial<ProductScores>
}

export interface Product {
  id: string
  tenant_id: string
  type: ProductType
  name: string
  description: string | null
  data: Partial<ProductData> | null
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export const TYPE_META: Record<ProductType, { label: string; color: string; description: string }> = {
  current:          { label: 'Current',         color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',  description: 'Live products generating revenue' },
  proposed:         { label: 'Proposed',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',              description: 'Ideas under consideration' },
  launch:           { label: 'Launch',           color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',      description: 'Ready to launch or launching soon' },
  strategic_growth: { label: 'Strategic Growth', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',          description: 'Targeted for growth investment' },
  shelved:          { label: 'Shelved',          color: 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400',              description: 'Paused or discontinued' },
}

export const PRODUCT_TYPES: ProductType[] = ['current', 'proposed', 'launch', 'strategic_growth', 'shelved']

export const BUSINESSES = [
  { code: 'BRL', label: 'Brinkman Reforestation',             color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { code: 'BLI', label: 'Brinkman Living Infrastructure',    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  { code: 'BER', label: 'Brinkman Environmental Restoration', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { code: 'BG',  label: 'Brinkman Group',                    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
]

export const CATEGORY_TAGS = [
  { code: 'A', label: 'Core Forestry Implementation',          color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300' },
  { code: 'B', label: 'Ecological Restoration Implementation', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  { code: 'C', label: 'Nature-Based Solutions',                color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { code: 'D', label: 'Advisory & Professional Services',      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
]

export const SCORE_FIELDS: { key: keyof ProductScores; label: string }[] = [
  { key: 'brinkman_fit',       label: 'Brinkman Fit' },
  { key: 'skills',             label: 'Skills Score' },
  { key: 'bc_readiness',       label: 'BC Readiness' },
  { key: 'client',             label: 'Client Score' },
  { key: 'client_predicted',   label: 'Client Predicted' },
  { key: 'revenue',            label: 'Revenue Score' },
  { key: 'revenue_predicted',  label: 'Revenue Predicted' },
  { key: 'market',             label: 'Market Score' },
  { key: 'opportunity',        label: 'Opportunity' },
  { key: 'competition',        label: 'Competition' },
  { key: 'consensus',          label: 'Consensus Score' },
  { key: 'forecast_1yr',       label: '1-Year Forecast' },
  { key: 'forecast_3yr',       label: '3-Year Forecast' },
  { key: 'forecast_5yr',       label: '5-Year Forecast' },
]
