'use client'

import type { Product } from './types'
import { TYPE_META, BUSINESSES } from './types'
import HealthCircle from './health-circle'
import Link from 'next/link'

interface Props {
  products: Product[]
  tenantSlug: string
}

export default function PerformanceMetrics({ products, tenantSlug }: Props) {
  const sorted = [...products]
    .filter((p) => p.data?.scores?.brinkman_fit != null)
    .sort((a, b) => (b.data?.scores?.brinkman_fit ?? 0) - (a.data?.scores?.brinkman_fit ?? 0))

  const noScores = products.filter((p) => p.data?.scores?.brinkman_fit == null)

  const scoreKeys: Array<{ key: keyof NonNullable<NonNullable<Product['data']>['scores']>; short: string }> = [
    { key: 'skills',            short: 'Skills' },
    { key: 'bc_readiness',      short: 'BC' },
    { key: 'client',            short: 'Client' },
    { key: 'revenue',           short: 'Revenue' },
    { key: 'market',            short: 'Market' },
    { key: 'opportunity',       short: 'Opp.' },
    { key: 'competition',       short: 'Comp.' },
    { key: 'consensus',         short: 'Consensus' },
  ]

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20 text-[rgb(var(--text-2))]">
        <p className="text-lg mb-2">No scores yet</p>
        <p className="text-sm">Open a product and enter Brinkman scores to see performance metrics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-[rgb(var(--border))]">
            <th className="text-left py-2 pr-4 font-medium text-[rgb(var(--text-2))] text-xs whitespace-nowrap">Product</th>
            <th className="py-2 px-2 font-medium text-[rgb(var(--text-2))] text-xs text-center whitespace-nowrap">Fit</th>
            {scoreKeys.map(({ short }) => (
              <th key={short} className="py-2 px-2 font-medium text-[rgb(var(--text-2))] text-xs text-center whitespace-nowrap">{short}</th>
            ))}
            <th className="py-2 px-2 font-medium text-[rgb(var(--text-2))] text-xs text-center whitespace-nowrap">1yr</th>
            <th className="py-2 px-2 font-medium text-[rgb(var(--text-2))] text-xs text-center whitespace-nowrap">3yr</th>
            <th className="py-2 px-2 font-medium text-[rgb(var(--text-2))] text-xs text-center whitespace-nowrap">5yr</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const s = p.data?.scores ?? {}
            const typeMeta = TYPE_META[p.type]
            const bus = (p.data?.business_units ?? []).slice(0, 2)
            return (
              <tr key={p.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] transition-colors">
                <td className="py-3 pr-4">
                  <Link href={`/${tenantSlug}/products/${p.id}`} className="font-medium text-[rgb(var(--text-1))] hover:text-[rgb(var(--accent))] transition-colors">
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeMeta.color}`}>{typeMeta.label}</span>
                    {bus.map((b) => {
                      const biz = BUSINESSES.find((x) => x.code === b)
                      return biz ? <span key={b} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${biz.color}`}>{b}</span> : null
                    })}
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  {s.brinkman_fit != null ? <HealthCircle value={s.brinkman_fit} size={36} strokeWidth={3} /> : <span className="text-[rgb(var(--text-3))]">—</span>}
                </td>
                {scoreKeys.map(({ key }) => {
                  const v = s[key]
                  return (
                    <td key={key} className="py-3 px-2 text-center">
                      {v != null ? (
                        <span className={`text-xs font-semibold tabular-nums ${v >= 70 ? 'text-green-600 dark:text-green-400' : v >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                          {v}
                        </span>
                      ) : <span className="text-[10px] text-[rgb(var(--text-3))]">—</span>}
                    </td>
                  )
                })}
                {(['forecast_1yr', 'forecast_3yr', 'forecast_5yr'] as const).map((fk) => {
                  const v = s[fk]
                  return (
                    <td key={fk} className="py-3 px-2 text-center">
                      {v != null ? <span className="text-xs font-medium tabular-nums text-[rgb(var(--text-2))]">{v}%</span> : <span className="text-[10px] text-[rgb(var(--text-3))]">—</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {noScores.length > 0 && (
        <p className="text-xs text-[rgb(var(--text-3))]">
          {noScores.length} product{noScores.length > 1 ? 's' : ''} without scores not shown:{' '}
          {noScores.map((p, i) => (
            <span key={p.id}>
              <Link href={`/${tenantSlug}/products/${p.id}`} className="underline hover:text-[rgb(var(--accent))]">{p.name}</Link>
              {i < noScores.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
