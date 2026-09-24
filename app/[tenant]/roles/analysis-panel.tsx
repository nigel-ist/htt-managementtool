'use client'

/**
 * RolesAnalysisPanel — AI org design assessment for the roles module.
 */
import { useState } from 'react'

interface Role {
  id: string
  title: string
  department: string | null
  level: string | null
  responsibilities: string | null
  headcount: number
  is_open: boolean
}

interface Props {
  tenantSlug: string
  roles: Role[]
}

export default function RolesAnalysisPanel({ tenantSlug, roles }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  if (roles.length === 0) return null

  async function analyse() {
    setLoading(true)
    setError(null)

    const context = roles
      .map(r => {
        const dept = r.department ? ` — ${r.department}` : ''
        const level = r.level ? ` (${r.level})` : ''
        const status = r.is_open ? ' [OPEN]' : ''
        const hc = r.headcount > 1 ? ` × ${r.headcount}` : ''
        const parts = [`${r.title}${level}${dept}${hc}${status}`]
        if (r.responsibilities) parts.push(r.responsibilities.slice(0, 200))
        return parts.join('\n')
      })
      .join('\n\n')

    const openCount = roles.filter(r => r.is_open).length
    const totalHeadcount = roles.reduce((sum, r) => sum + r.headcount, 0)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'roles_analysis',
          context,
          prompt: `Analyse this org structure of ${roles.length} role${roles.length !== 1 ? 's' : ''} (${totalHeadcount} headcount, ${openCount} open). What does the role and level distribution reveal about the organisation? Are there structural gaps, over-indexing on certain levels, or open roles that look critical?`,
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
            Org Design Analysis
          </p>
          <p className="text-xs text-[rgb(var(--text-2,var(--fg-muted)))] mt-0.5">
            AI assessment across {roles.length} role{roles.length !== 1 ? 's' : ''}
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
            {loading ? 'Analysing…' : result ? 'Regenerate' : 'Analyse org design'}
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
