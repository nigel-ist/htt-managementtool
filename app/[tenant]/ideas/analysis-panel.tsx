'use client'

/**
 * IdeaPortfolioAnalysisPanel — AI backlog analysis for the ideas module.
 */
import { useState } from 'react'

interface Idea {
  id: string
  title: string
  description: string | null
  status: string
  tags: string[]
}

interface Props {
  tenantSlug: string
  ideas: Idea[]
}

export default function IdeaPortfolioAnalysisPanel({ tenantSlug, ideas }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  if (ideas.length === 0) return null

  async function analyse() {
    setLoading(true)
    setError(null)

    const context = ideas
      .map(i => {
        const parts = [`[${i.status.toUpperCase().replace('_', ' ')}] ${i.title}`]
        if (i.description) parts.push(i.description.slice(0, 300))
        if (i.tags.length) parts.push(`Tags: ${i.tags.join(', ')}`)
        return parts.join('\n')
      })
      .join('\n\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'idea_portfolio_analysis',
          context,
          prompt: `Analyse this idea backlog of ${ideas.length} idea${ideas.length !== 1 ? 's' : ''}. What themes emerge? Which ideas look most strategically promising? What does the status distribution suggest about the organisation's approach to innovation?`,
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
    <div className="mt-8 p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface,var(--bg-card)))]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3,var(--fg-muted)))]">
            Idea Portfolio Analysis
          </p>
          <p className="text-xs text-[rgb(var(--text-2,var(--fg-muted)))] mt-0.5">
            AI synthesis across {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <button
              onClick={() => setVisible(v => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-2,var(--fg-muted)))] hover:bg-[rgb(var(--bg))] transition-colors"
            >
              {visible ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            onClick={analyse}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Analysing…' : result ? 'Regenerate' : 'Analyse ideas'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}

      {result && visible && (
        <div className="mt-4 space-y-3 border-t border-[rgb(var(--border))] pt-4">
          {result.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--text-1,var(--fg)))] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
