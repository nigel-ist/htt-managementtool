'use client'

/**
 * ProductAnalysisPanel — AI portfolio analysis for the Products page.
 *
 * Sends the full product list to /api/ai with purpose 'product_analysis'
 * and renders the structured response.
 */
import { useState } from 'react'
import type { Product } from './types'
import { TYPE_META } from './types'

interface Props {
  tenantSlug: string
  products: Product[]
}

export default function ProductAnalysisPanel({ tenantSlug, products }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)

    // Build a concise context string per product
    const context = products
      .map((p) => {
        const meta = TYPE_META[p.type]
        return `[${meta.label}] ${p.name}${p.description ? ': ' + p.description : ''}`
      })
      .join('\n')

    const prompt =
      'Analyse this product portfolio. Identify the strategic mix, any concentration risks, ' +
      'gaps worth addressing, and the 2–3 most important priorities the team should focus on next. ' +
      'Be specific and actionable.'

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'product_analysis',
          context,
          prompt,
          tenantSlug,
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const { result, error: aiErr } = await res.json()
      if (aiErr) throw new Error(aiErr)

      setAnalysis(result)
      setOpen(true)
    } catch {
      setError('Could not generate analysis. Check that ANTHROPIC_API_KEY is set.')
    } finally {
      setLoading(false)
    }
  }

  if (products.length === 0) return null

  return (
    <div className="mt-10 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--surface))] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-1))]">Portfolio Analysis</h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          {analysis && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-xs text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] transition-colors"
            >
              {open ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[rgb(var(--color-primary,59_130_246))] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <>
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analysing…
              </>
            ) : analysis ? (
              'Regenerate'
            ) : (
              'Analyse portfolio'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 pb-4 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Result */}
      {analysis && open && (
        <div className="px-5 pb-5 border-t border-[rgb(var(--border))]">
          <div className="pt-4 space-y-3">
            {analysis.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-[rgb(var(--text-2))] leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
