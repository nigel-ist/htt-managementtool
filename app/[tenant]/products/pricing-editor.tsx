'use client'

import { useState } from 'react'
import type { PricingTier } from './types'

interface Props {
  initial: PricingTier[]
}

export default function PricingEditor({ initial }: Props) {
  const [tiers, setTiers] = useState<PricingTier[]>(initial.length > 0 ? initial : [])

  function add() {
    setTiers((prev) => [...prev, { label: '', price: '' }])
  }

  function remove(i: number) {
    setTiers((prev) => prev.filter((_, idx) => idx !== i))
  }

  function update(i: number, field: keyof PricingTier, value: string) {
    setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  const inputCls = 'flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'

  return (
    <div className="space-y-2">
      <input type="hidden" name="pricing_json" value={JSON.stringify(tiers)} />
      {tiers.map((tier, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={tier.label}
            onChange={(e) => update(i, 'label', e.target.value)}
            placeholder="Tier name (e.g. Base)"
            className={inputCls}
          />
          <input
            type="text"
            value={tier.price}
            onChange={(e) => update(i, 'price', e.target.value)}
            placeholder="Price (e.g. $5,000)"
            className={`${inputCls} max-w-[140px]`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-[rgb(var(--text-3))] hover:text-red-500 transition-colors p-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-medium text-[rgb(var(--accent))] hover:opacity-80 transition-opacity"
      >
        + Add pricing tier
      </button>
    </div>
  )
}
