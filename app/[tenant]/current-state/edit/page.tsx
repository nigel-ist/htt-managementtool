'use client'

/**
 * Current State — edit/assessment form.
 *
 * Walks through 15 dimensions across 3 categories.
 * Each dimension gets a 1–5 score and optional notes.
 * Submits to the `saveCurrentState` Server Action.
 */

import { useEffect, useRef, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { saveCurrentState, CATEGORIES, getCurrentState } from '../actions'

// ─── Score helpers ────────────────────────────────────────────────

const SCORE_LABELS = ['Critical', 'Needs Work', 'Developing', 'Strong', 'Excellent']
const SCORE_COLORS = [
  'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
]
const SCORE_RINGS = ['ring-red-400', 'ring-orange-400', 'ring-amber-400', 'ring-blue-400', 'ring-emerald-400']

function DimensionRow({
  category,
  dimension,
  value,
  notes,
  onChange,
  onNotesChange,
}: {
  category: string
  dimension: string
  value: number | null
  notes: string
  onChange: (score: number) => void
  onNotesChange: (notes: string) => void
}) {
  return (
    <div className="border border-[rgb(var(--border))] rounded-lg p-4 bg-[rgb(var(--bg-card))]">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-[rgb(var(--fg))]">{dimension}</h4>
        {value !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SCORE_COLORS[value - 1]}`}>
            {SCORE_LABELS[value - 1]}
          </span>
        )}
      </div>

      {/* Score buttons */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={[
              'flex-1 py-2 rounded-md border-2 text-sm font-bold transition-all',
              value === s
                ? `${SCORE_COLORS[s - 1]} ${SCORE_RINGS[s - 1]} ring-2 ring-offset-1`
                : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] hover:border-[rgb(var(--color-primary,59_130_246))/0.4]',
            ].join(' ')}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Notes */}
      {value !== null && (
        <textarea
          placeholder="Add context or notes (optional)…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          className="mt-3 w-full text-xs px-3 py-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] resize-none focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary,59_130_246))]"
        />
      )}

      {/* Hidden inputs for form serialisation */}
      <input type="hidden" name={`score_${category}_${dimension}`} value={value ?? ''} />
      <input type="hidden" name={`notes_${category}_${dimension}`} value={notes} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

type Scores = Record<string, Record<string, number | null>>
type Notes  = Record<string, Record<string, string>>

export default function CurrentStateEditPage() {
  const params = useParams<{ tenant: string }>()
  const tenantSlug = params.tenant

  const [scores, setScores] = useState<Scores>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.key, Object.fromEntries(c.dimensions.map((d) => [d, null]))]))
  )
  const [notes, setNotes] = useState<Notes>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.key, Object.fromEntries(c.dimensions.map((d) => [d, '']))]))
  )
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Load existing scores on mount
  useEffect(() => {
    getCurrentState(tenantSlug).then((data) => {
      if (!data) { setLoaded(true); return }
      const newScores: Scores = Object.fromEntries(CATEGORIES.map((c) => [c.key, Object.fromEntries(c.dimensions.map((d) => [d, null]))]))
      const newNotes: Notes  = Object.fromEntries(CATEGORIES.map((c) => [c.key, Object.fromEntries(c.dimensions.map((d) => [d, '']))]))
      for (const row of data.scores) {
        if (newScores[row.category]) newScores[row.category][row.dimension] = row.score
        if (newNotes[row.category])  newNotes[row.category][row.dimension]  = row.notes ?? ''
      }
      setScores(newScores)
      setNotes(newNotes)
      setLoaded(true)
    })
  }, [tenantSlug])

  const rated = CATEGORIES.flatMap((c) => c.dimensions).filter(
    (d) => {
      const cat = CATEGORIES.find((c) => c.dimensions.includes(d))!
      return scores[cat.key][d] !== null
    }
  ).length
  const total = CATEGORIES.reduce((n, c) => n + c.dimensions.length, 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    const fd = new FormData(e.currentTarget)
    startTransition(() => saveCurrentState(tenantSlug, fd))
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-4">
          <a href={`/${tenantSlug}/current-state`} className="hover:text-[rgb(var(--fg))] transition-colors">
            Current State
          </a>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[rgb(var(--fg))]">Assessment</span>
        </nav>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Current State Assessment</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))] max-w-xl">
          Score each dimension honestly. 1 = Critical weakness · 5 = Outstanding strength.
          Add notes to give context for the score.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-[rgb(var(--border))] overflow-hidden">
          <div
            className="h-full bg-[rgb(var(--color-primary,59_130_246))] rounded-full transition-all"
            style={{ width: `${(rated / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-[rgb(var(--fg-muted))] tabular-nums flex-shrink-0">{rated}/{total}</span>
      </div>

      {!loaded ? (
        <div className="py-12 text-center text-sm text-[rgb(var(--fg-muted))]">Loading…</div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {CATEGORIES.map((cat) => (
            <section key={cat.key}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-3">
                {cat.label}
              </h2>
              <div className="space-y-3">
                {cat.dimensions.map((dim) => (
                  <DimensionRow
                    key={dim}
                    category={cat.key}
                    dimension={dim}
                    value={scores[cat.key][dim]}
                    notes={notes[cat.key][dim]}
                    onChange={(s) =>
                      setScores((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], [dim]: s } }))
                    }
                    onNotesChange={(n) =>
                      setNotes((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], [dim]: n } }))
                    }
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Actions */}
          <div className="pt-2 pb-8 flex items-center justify-between">
            <a
              href={`/${tenantSlug}/current-state`}
              className="text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
            >
              ← Cancel
            </a>
            <button
              type="submit"
              disabled={rated === 0 || isPending}
              className={[
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                rated > 0 && !isPending
                  ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white hover:opacity-90'
                  : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] cursor-not-allowed',
              ].join(' ')}
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  Save assessment
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
