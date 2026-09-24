'use client'

/**
 * CompetitionAnalysisPanel — AI landscape analysis for the competition module.
 */
import { useState } from 'react'
import type { Competitor } from './types'
import { TIER_META } from './types'

interface Props {
  tenantSlug: string
  competitors: Competitor[]
}

export default function CompetitionAnalysisPanel({ tenantSlug, competitors }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  if (competitors.length === 0) return null

  async function analyse() {
    setLoading(true)
    setError(null)

    const context = competitors
      .map(c => {
        const tier = TIER_META[c.tier]?.label ?? c.tier
        const parts = [`[${tier}] ${c.name}`]
        if (c.summary) parts.push(`Summary: ${c.summary}`)
        if (c.strengths.length) parts.push(`Strengths: ${c.strengths.join(', ')}`)
        if (c.weaknesses.length) parts.push(`Weaknesses: ${c.weaknesses.join(', ')}`)
        return parts.join('\n')
      })
      .join('\n\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'competition_analysis',
          context,
          prompt: `Analyse this competitive landscape for the ${competitors.length} tracked competitor${competitors.length !== 1 ? 's' : ''}. What are the most important strategic implications?`,
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
            Competitive Landscape Analysis
          </p>
          <p className="text-xs text-[rgb(var(--text-2))] mt-0.5">
            AI-powered assessment across {competitors.length} tracked competitor{competitors.length !== 1 ? 's' : ''}
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
            {loading ? 'Analysing…' : result ? 'Regenerate' : 'Analyse landscape'}
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
