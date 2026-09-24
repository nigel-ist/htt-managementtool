'use client'

/**
 * RelationshipNetworkAnalysisPanel — AI stakeholder network analysis.
 */
import { useState } from 'react'

interface Relationship {
  id: string
  name: string
  organisation: string | null
  category: string
  notes: string | null
  tags: string[]
}

interface Props {
  tenantSlug: string
  relationships: Relationship[]
}

export default function RelationshipNetworkAnalysisPanel({ tenantSlug, relationships }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  if (relationships.length === 0) return null

  async function analyse() {
    setLoading(true)
    setError(null)

    const context = relationships
      .map(r => {
        const org = r.organisation ? ` (${r.organisation})` : ''
        const tags = r.tags.length ? ` [${r.tags.join(', ')}]` : ''
        const parts = [`[${r.category.toUpperCase()}] ${r.name}${org}${tags}`]
        if (r.notes) parts.push(r.notes.slice(0, 200))
        return parts.join('\n')
      })
      .join('\n\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'relationship_network_analysis',
          context,
          prompt: `Analyse this stakeholder network of ${relationships.length} relationship${relationships.length !== 1 ? 's' : ''}. What does the category mix reveal about the organisation's external positioning? What relationship types are over- or under-invested? What strategic gaps stand out?`,
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
            Network Analysis
          </p>
          <p className="text-xs text-[rgb(var(--text-2,var(--fg-muted)))] mt-0.5">
            AI assessment across {relationships.length} relationship{relationships.length !== 1 ? 's' : ''}
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
            {loading ? 'Analysing…' : result ? 'Regenerate' : 'Analyse network'}
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
