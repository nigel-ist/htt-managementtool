'use client'

/**
 * InnovationPipelineAnalysisPanel — AI pipeline health analysis for the innovations module.
 */
import { useState } from 'react'

interface Innovation {
  id: string
  title: string
  stage: string
  data: { description?: string | null } | null
}

interface Props {
  tenantSlug: string
  innovations: Innovation[]
}

export default function InnovationPipelineAnalysisPanel({ tenantSlug, innovations }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  if (innovations.length === 0) return null

  async function analyse() {
    setLoading(true)
    setError(null)

    const context = innovations
      .map(i => {
        const parts = [`[${i.stage.toUpperCase()}] ${i.title}`]
        if (i.data?.description) parts.push(i.data.description.slice(0, 300))
        return parts.join('\n')
      })
      .join('\n\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'innovation_pipeline_analysis',
          context,
          prompt: `Analyse this innovation pipeline of ${innovations.length} item${innovations.length !== 1 ? 's' : ''}. What does the distribution across stages tell us? What patterns, risks, or opportunities stand out?`,
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
    <div className="mt-8 p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))]">
            Pipeline Health Analysis
          </p>
          <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">
            AI assessment across {innovations.length} pipeline item{innovations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <button
              onClick={() => setVisible(v => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg))] transition-colors"
            >
              {visible ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            onClick={analyse}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Analysing…' : result ? 'Regenerate' : 'Analyse pipeline'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}

      {result && visible && (
        <div className="mt-4 space-y-3 border-t border-[rgb(var(--border))] pt-4">
          {result.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--fg))] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
