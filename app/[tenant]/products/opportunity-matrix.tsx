'use client'

import { useState } from 'react'
import type { Product } from './types'
import { TYPE_META } from './types'
import Link from 'next/link'

interface Props {
  products: Product[]
  tenantSlug: string
}

const W = 700
const H = 500
const PAD = 48

function scoreColor(type: Product['type']): string {
  const map: Record<string, string> = {
    current:         '#16a34a',
    launch:          '#7c3aed',
    proposed:        '#2563eb',
    strategic_growth:'#d97706',
    shelved:         '#9ca3af',
  }
  return map[type] ?? '#6b7280'
}

export default function OpportunityMatrix({ products, tenantSlug }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  // Filter products that have opportunity + competition scores
  const plotted = products.filter(
    (p) => p.data?.scores?.opportunity != null && p.data?.scores?.competition != null
  )
  const unplotted = products.filter(
    (p) => p.data?.scores?.opportunity == null || p.data?.scores?.competition == null
  )

  // Map score 0-100 to SVG coordinates
  function px(opp: number) { return PAD + (opp / 100) * (W - PAD * 2) }
  function py(comp: number) { return H - PAD - (comp / 100) * (H - PAD * 2) }

  // Revenue strength → circle radius (10–36)
  function radius(p: Product) {
    const rev = p.data?.scores?.revenue ?? 50
    return 10 + (rev / 100) * 26
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[700px] mx-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
          style={{ minHeight: 300 }}
        >
          {/* Quadrant shading */}
          <rect x={PAD} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="rgba(220,252,231,0.35)" />
          <rect x={PAD + (W - PAD * 2) / 2} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="rgba(220,252,231,0.6)" />
          <rect x={PAD} y={PAD + (H - PAD * 2) / 2} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="rgba(254,243,199,0.4)" />
          <rect x={PAD + (W - PAD * 2) / 2} y={PAD + (H - PAD * 2) / 2} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="rgba(239,246,255,0.5)" />

          {/* Grid lines */}
          <line x1={PAD} y1={PAD + (H - PAD * 2) / 2} x2={W - PAD} y2={PAD + (H - PAD * 2) / 2} stroke="rgb(var(--border))" strokeWidth="1" strokeDasharray="4,4" />
          <line x1={PAD + (W - PAD * 2) / 2} y1={PAD} x2={PAD + (W - PAD * 2) / 2} y2={H - PAD} stroke="rgb(var(--border))" strokeWidth="1" strokeDasharray="4,4" />

          {/* Axes */}
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgb(var(--text-3))" strokeWidth="1.5" />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="rgb(var(--text-3))" strokeWidth="1.5" />

          {/* Axis labels */}
          <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-[rgb(var(--text-3))]" fontSize="11" fontWeight="500">
            Opportunity →
          </text>
          <text x={12} y={H / 2} textAnchor="middle" className="fill-[rgb(var(--text-3))]" fontSize="11" fontWeight="500"
            transform={`rotate(-90, 12, ${H / 2})`}>
            Competitive Advantage →
          </text>

          {/* Quadrant labels */}
          <text x={PAD + 8} y={PAD + 16} className="fill-[rgb(var(--text-3))]" fontSize="9" opacity="0.7">Niche / Defend</text>
          <text x={PAD + (W - PAD * 2) / 2 + 8} y={PAD + 16} className="fill-[rgb(var(--text-3))]" fontSize="9" opacity="0.7">Stars / Invest</text>
          <text x={PAD + 8} y={PAD + (H - PAD * 2) / 2 + 16} className="fill-[rgb(var(--text-3))]" fontSize="9" opacity="0.7">Question Marks</text>
          <text x={PAD + (W - PAD * 2) / 2 + 8} y={PAD + (H - PAD * 2) / 2 + 16} className="fill-[rgb(var(--text-3))]" fontSize="9" opacity="0.7">Growth / Develop</text>

          {/* Product circles */}
          {plotted.map((p) => {
            const opp  = p.data!.scores!.opportunity!
            const comp = p.data!.scores!.competition!
            const cx   = px(opp)
            const cy   = py(comp)
            const r    = radius(p)
            const isHovered = hovered === p.id
            const color = scoreColor(p.type)

            return (
              <g key={p.id}>
                <Link href={`/${tenantSlug}/products/${p.id}`}>
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill={color}
                    fillOpacity={isHovered ? 0.9 : 0.65}
                    stroke={color}
                    strokeWidth={isHovered ? 2 : 1}
                    style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                </Link>
                {/* Label */}
                <text
                  x={cx} y={cy + r + 11}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={isHovered ? '700' : '500'}
                  className="fill-[rgb(var(--text-1))] pointer-events-none"
                  style={{ maxWidth: 70 }}
                >
                  {p.name.length > 16 ? p.name.slice(0, 15) + '…' : p.name}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={cx - 72} y={cy - r - 54}
                      width={144} height={48}
                      rx={6}
                      fill="rgb(var(--surface))"
                      stroke="rgb(var(--border))"
                      strokeWidth="1"
                    />
                    <text x={cx} y={cy - r - 38} textAnchor="middle" fontSize="10" fontWeight="600" className="fill-[rgb(var(--text-1))] pointer-events-none">
                      {p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name}
                    </text>
                    <text x={cx} y={cy - r - 22} textAnchor="middle" fontSize="9" className="fill-[rgb(var(--text-2))] pointer-events-none">
                      Opp: {opp} · Adv: {comp} · Rev: {p.data?.scores?.revenue ?? '?'}
                    </text>
                    <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize="9" className="fill-[rgb(var(--text-2))] pointer-events-none">
                      Fit: {p.data?.scores?.brinkman_fit ?? '?'}% · {TYPE_META[p.type].label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: scoreColor(type as Product['type']) }} />
            <span className="text-[rgb(var(--text-2))]">{meta.label}</span>
          </div>
        ))}
        <span className="text-[rgb(var(--text-3))] ml-2">· Circle size = Revenue strength</span>
      </div>

      {/* Unplotted products */}
      {unplotted.length > 0 && (
        <div className="text-xs text-[rgb(var(--text-3))] border border-dashed border-[rgb(var(--border))] rounded-lg px-4 py-3">
          <span className="font-medium text-[rgb(var(--text-2))]">{unplotted.length} product{unplotted.length > 1 ? 's' : ''} not shown</span>
          {' '}— Opportunity and Competition scores needed to appear on the matrix:{' '}
          {unplotted.map((p, i) => (
            <span key={p.id}>
              <Link href={`/${tenantSlug}/products/${p.id}`} className="underline hover:text-[rgb(var(--accent))]">{p.name}</Link>
              {i < unplotted.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {plotted.length === 0 && (
        <div className="text-center py-16 text-[rgb(var(--text-3))]">
          <p className="text-sm">No products have Opportunity and Competition scores yet.</p>
          <p className="text-xs mt-1">Open a product and set both scores to place it on the matrix.</p>
        </div>
      )}
    </div>
  )
}
