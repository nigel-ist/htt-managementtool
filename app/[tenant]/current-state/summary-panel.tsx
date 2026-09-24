'use client'

/**
 * CurrentStateSummary — AI interpretation panel for the current state view.
 *
 * Renders as a collapsible section below the category cards.
 * On click, builds a text summary of all scores and requests an AI assessment
 * from /api/ai (purpose: 'current_state_summary'). Result is displayed inline.
 * Nothing is persisted — this is a read-time insight.
 */

import { useState } from 'react'
import type { DimensionScore } from './types'

interface Props {
  tenantSlug: string
  scores: DimensionScore[]
}

function scoreLabel(score: number): string {
  if (score <= 1) return 'Critical'
  if (score <= 2) return 'Needs Work'
  if (score <= 3) return 'Developing'
  if (score <= 4) return 'Strong'
  return 'Excellent'
}

export default function CurrentStateSummary({ tenantSlug, scores }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)

    const context = scores
      .map((s) => `${s.dimension} (${s.category}): ${s.score}/5 — ${scoreLabel(s.score)}${s.notes ? `. Notes: ${s.notes}` : ''}`)
      .join('\n')

    const prompt =
      'Based on the assessment data above, identify the organisation\'s top 2–3 strengths and the 2–3 most critical gaps that need attention. Be specific and actionable.'

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'current_state_summary',
          context,
          prompt,
          tenantSlug,
        }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const { result, error: aiErr } = await res.json()
      if (aiErr) throw new Error(aiErr)
      setSummary(result)
      setOpen(true)
    } catch (err) {
      console.error('[current-state/summary]', err)
      setError('Could not generate summary. Check that ANTHROPIC_API_KEY is set.')
    } finally {
      setLoading(false)
    }
  }

  if (scores.length === 0) return null

  return (
    <section className="mt-8 pt-6 border-t border-[rgb(var(--border))]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))]">
            AI Assessment
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            AI-generated
          </span>
        </div>
        {!summary ? (
          <button
            onClick={generate}
            disabled={loading}
            className={[
              'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all',
              !loading
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-3))] cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analysing…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate AI Summary
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors"
          >
            {open ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {summary && open && (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl p-5">
          {summary.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--text-2))] leading-relaxed mb-3 last:mb-0">
              {para}
            </p>
          ))}
          <div className="mt-4 pt-3 border-t border-[rgb(var(--border))] flex justify-end">
            <button
              onClick={generate}
              disabled={loading}
              className="text-xs text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
