'use client'

/**
 * MarketIntelAnalysisPanel — AI synthesis for the market-intel module.
 */
import { useState } from 'react'
import type { MarketIntelEntry } from './types'
import { CATEGORY_META } from './types'

interface Props {
  tenantSlug: string
  entries: MarketIntelEntry[]
}

export default function MarketIntelAnalysisPanel({ tenantSlug, entries }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  if (entries.length === 0) return null

  async function analyse() {
    setLoading(true)
    setError(null)

    const context = entries
      .map(e => {
        const cat = CATEGORY_META[e.category]?.label ?? e.category
        const parts = [`[${cat}] ${e.title}`]
        if (e.body) parts.push(e.body.slice(0, 400))
        return parts.join('\n')
      })
      .join('\n\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'market_intel_summary',
          context,
          prompt: `Synthesise these ${entries.length} market intelligence entries into a strategic picture. What patterns and implications stand out?`,
          tenantSlug,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Analysis failed.')
      } else {
        const body = await res.json()
        setResult(body.result)
        setVisible(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))]">
            Market Intelligence Summary
          </p>
          <p className="text-xs text-[rgb(var(--text-2))] mt-0.5">
            AI synthesis across {entries.length} intel entr{entries.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <button
              onClick={() => setVisible(v => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-2))] hover:bg-[rgb(var(--bg))] transition-colors"
            >
              {visible ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            onClick={analyse}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Synthesising…' : result ? 'Regenerate' : 'Synthesise intel'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}

      {result && visible && (
        <div className="mt-4 space-y-3 border-t border-[rgb(var(--border))] pt-4">
          {result.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
