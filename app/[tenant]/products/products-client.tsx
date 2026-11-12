'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from './types'
import { PRODUCT_TYPES, TYPE_META, BUSINESSES, CATEGORY_TAGS } from './types'
import { getScore } from './score-utils'
import HealthCircle from './health-circle'
import OpportunityMatrix from './opportunity-matrix'
import PerformanceMetrics from './performance-metrics'

type Tab = 'matrix' | 'current' | 'launch' | 'proposed' | 'strategic_growth' | 'shelved' | 'metrics'

const TABS: { key: Tab; label: string }[] = [
  { key: 'matrix',          label: 'Matrix' },
  { key: 'current',         label: 'Current' },
  { key: 'launch',          label: 'Launch' },
  { key: 'proposed',        label: 'Proposed' },
  { key: 'strategic_growth',label: 'Strategic' },
  { key: 'shelved',         label: 'Shelved' },
  { key: 'metrics',         label: 'Metrics' },
]

interface Props {
  products: Product[]
  tenantSlug: string
  initialTab: string
  fitLabel?: string
}

export default function ProductsClient({ products, tenantSlug, initialTab, fitLabel = 'Fit' }: Props) {
  const validTab = TABS.find((t) => t.key === initialTab)?.key ?? 'matrix'
  const [activeTab, setActiveTab] = useState<Tab>(validTab)

  const stageProducts = PRODUCT_TYPES.includes(activeTab as Product['type'])
    ? products.filter((p) => p.type === activeTab)
    : []

  return (
    <div>
      <div className="flex gap-0.5 mb-6 border-b border-[rgb(var(--border))] overflow-x-auto">
        {TABS.map((tab) => {
          const count = tab.key === 'matrix' || tab.key === 'metrics'
            ? null
            : products.filter((p) => p.type === tab.key).length
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
                ${isActive
                  ? 'text-[rgb(var(--accent))] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[rgb(var(--accent))] after:rounded-t'
                  : 'text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]'
                }
              `}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span className={`ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[rgb(var(--accent))] text-white' : 'bg-[rgb(var(--bg))] text-[rgb(var(--text-3))]'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'matrix' && (
        <OpportunityMatrix products={products} tenantSlug={tenantSlug} />
      )}

      {PRODUCT_TYPES.includes(activeTab as Product['type']) && (
        <StageGrid products={stageProducts} tenantSlug={tenantSlug} type={activeTab as Product['type']} />
      )}

      {activeTab === 'metrics' && (
        <PerformanceMetrics products={products} tenantSlug={tenantSlug} fitLabel={fitLabel} />
      )}
    </div>
  )
}

function StageGrid({ products, tenantSlug, type }: { products: Product[]; tenantSlug: string; type: Product['type'] }) {
  const meta = TYPE_META[type]

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-[rgb(var(--text-2))]">
        <p className="text-lg mb-1">No {meta.label.toLowerCase()} products</p>
        <p className="text-sm">Products in this stage will appear here.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => <ProductCard key={p.id} product={p} tenantSlug={tenantSlug} />)}
    </div>
  )
}

function ProductCard({ product, tenantSlug }: { product: Product; tenantSlug: string }) {
  const meta = TYPE_META[product.type]
  const d = product.data ?? {}
  const fit = getScore(product, 'brinkman_fit')
  const bus = (d.business_units ?? []).slice(0, 3)
  const tags = (d.category_tags ?? []).slice(0, 2)

  return (
    <Link
      href={`/${tenantSlug}/products/${product.id}`}
      className="group block p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))] transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[rgb(var(--text-1))] leading-tight group-hover:text-[rgb(var(--accent))] transition-colors">
            {product.name}
          </h3>
          {bus.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {bus.map((code) => {
                const biz = BUSINESSES.find((b) => b.code === code)
                return biz ? (
                  <span key={code} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${biz.color}`}>{code}</span>
                ) : null
              })}
              {tags.map((code) => {
                const cat = CATEGORY_TAGS.find((c) => c.code === code)
                return cat ? (
                  <span key={code} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cat.color}`}>{code}</span>
                ) : null
              })}
            </div>
          )}
        </div>
        {fit != null && (
          <div className="shrink-0">
            <HealthCircle value={fit} size={44} strokeWidth={4} />
          </div>
        )}
      </div>

      {product.description && (
        <p className="mt-2 text-sm text-[rgb(var(--text-2))] line-clamp-2">{product.description}</p>
      )}

      {/* Sub-score chips using getScore to handle both formats */}
      <div className="mt-3 flex flex-wrap gap-1">
        {(['opportunity','competition','revenue'] as const).map((k) => {
          const v = getScore(product, k)
          if (v == null) return null
          const labels: Record<string, string> = { opportunity: 'Opp', competition: 'Adv', revenue: 'Rev' }
          return (
            <span key={k} className={`text-[10px] font-medium px-1.5 py-0.5 rounded tabular-nums
              ${v >= 70 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : v >= 40 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}
            >
              {labels[k]} {v}
            </span>
          )
        })}
      </div>
    </Link>
  )
}
