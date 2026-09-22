'use client'

/**
 * Future State — edit page.
 *
 * Three sections:
 *   1. Vision statement (free text)
 *   2. Strategic goals (dynamic list, up to 5)
 *   3. AI narrative (generate or edit manually)
 *
 * Submits to the `saveFutureState` Server Action.
 */

import { useEffect, useRef, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { saveFutureState, getFutureState, type StrategicGoal } from '../actions'

const HORIZONS = ['6 months', '12 months', '2 years', '3 years', '5 years']

// ─── Goal editor ─────────────────────────────────────────────────

function GoalEditor({
  goal,
  index,
  onUpdate,
  onRemove,
}: {
  goal: StrategicGoal
  index: number
  onUpdate: (updated: StrategicGoal) => void
  onRemove: () => void
}) {
  return (
    <div className="border border-[rgb(var(--border))] rounded-xl p-4 bg-[rgb(var(--bg-card))]">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-[rgb(var(--color-primary,59_130_246))/0.1] flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-bold text-[rgb(var(--color-primary,59_130_246))]">{index + 1}</span>
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="Goal title…"
            value={goal.title}
            onChange={(e) => onUpdate({ ...goal, title: e.target.value })}
            className="w-full text-sm px-3 py-1.5 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary,59_130_246))]"
          />
          <textarea
            placeholder="Describe the goal in more detail (optional)…"
            value={goal.description ?? ''}
            onChange={(e) => onUpdate({ ...goal, description: e.target.value || null })}
            rows={2}
            className="w-full text-xs px-3 py-1.5 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] resize-none focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary,59_130_246))]"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-[rgb(var(--fg-muted))]">Horizon:</span>
            <div className="flex gap-1.5 flex-wrap">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onUpdate({ ...goal, horizon: goal.horizon === h ? null : h })}
                  className={[
                    'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                    goal.horizon === h
                      ? 'bg-[rgb(var(--color-primary,59_130_246))/0.1] border-[rgb(var(--color-primary,59_130_246))/0.4] text-[rgb(var(--color-primary,59_130_246))]'
                      : 'border-[rgb(var(--border))] text-[rgb(var(--fg-muted))] hover:border-[rgb(var(--color-primary,59_130_246))/0.4]',
                  ].join(' ')}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-[rgb(var(--fg-muted))] hover:text-red-500 transition-colors mt-0.5"
          aria-label="Remove goal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

let goalCounter = 0
function newGoalId() { return `goal_${++goalCounter}_${Date.now()}` }

export default function FutureStateEditPage() {
  const params = useParams<{ tenant: string }>()
  const tenantSlug = params.tenant

  const [vision, setVision] = useState('')
  const [goals, setGoals] = useState<StrategicGoal[]>([])
  const [narrative, setNarrative] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load existing data
  useEffect(() => {
    getFutureState(tenantSlug).then((data) => {
      if (data) {
        setVision(data.vision ?? '')
        setGoals(data.strategic_goals)
        setNarrative(data.ai_narrative ?? '')
      }
      setLoaded(true)
    })
  }, [tenantSlug])

  function addGoal() {
    if (goals.length >= 5) return
    setGoals((prev) => [...prev, { id: newGoalId(), title: '', description: null, horizon: null }])
  }

  function updateGoal(index: number, updated: StrategicGoal) {
    setGoals((prev) => prev.map((g, i) => (i === index ? updated : g)))
  }

  function removeGoal(index: number) {
    setGoals((prev) => prev.filter((_, i) => i !== index))
  }

  async function generateNarrative() {
    setGenerating(true)
    setGenerateError(null)

    const goalsList = goals
      .filter((g) => g.title.trim())
      .map((g, i) => `${i + 1}. ${g.title}${g.horizon ? ` (${g.horizon})` : ''}${g.description ? `: ${g.description}` : ''}`)
      .join('\n')

    const context = [
      vision ? `Vision: ${vision}` : '',
      goalsList ? `Strategic Goals:\n${goalsList}` : '',
    ].filter(Boolean).join('\n\n')

    const prompt = `Based on the vision and strategic goals above, write a compelling strategic narrative
that articulates where this organisation is heading and why. The narrative should feel confident,
specific, and grounded in the goals — not generic corporate language.`

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'future_state_narrative',
          context,
          prompt,
          tenantSlug,
        }),
      })

      if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
      const { result, error: aiError } = await res.json()
      if (aiError) throw new Error(aiError)
      setNarrative(result)
    } catch (err) {
      console.error('[future-state/edit] generate error:', err)
      setGenerateError('Could not generate narrative. Check that ANTHROPIC_API_KEY is set.')
    } finally {
      setGenerating(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return

    const fd = new FormData()
    fd.set('vision', vision)
    fd.set('ai_narrative', narrative)
    fd.set('goals_json', JSON.stringify(goals.filter((g) => g.title.trim())))

    startTransition(() => saveFutureState(tenantSlug, fd))
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-4">
          <a href={`/${tenantSlug}/future-state`} className="hover:text-[rgb(var(--fg))] transition-colors">
            Future State
          </a>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[rgb(var(--fg))]">Edit Vision</span>
        </nav>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Future State</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))] max-w-xl">
          Define your vision and up to five strategic goals. Generate an AI narrative to connect it all together.
        </p>
      </div>

      {!loaded ? (
        <div className="py-12 text-center text-sm text-[rgb(var(--fg-muted))]">Loading…</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vision */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-3">
              Vision Statement
            </h2>
            <textarea
              placeholder="In one or two sentences, describe where this organisation is heading…"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={3}
              name="vision"
              className="w-full text-sm px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] leading-relaxed"
            />
          </section>

          {/* Goals */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))]">
                Strategic Goals
              </h2>
              <span className="text-xs text-[rgb(var(--fg-muted))] tabular-nums">{goals.length}/5</span>
            </div>
            <div className="space-y-3">
              {goals.map((goal, idx) => (
                <GoalEditor
                  key={goal.id}
                  goal={goal}
                  index={idx}
                  onUpdate={(updated) => updateGoal(idx, updated)}
                  onRemove={() => removeGoal(idx)}
                />
              ))}
              {goals.length < 5 && (
                <button
                  type="button"
                  onClick={addGoal}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[rgb(var(--border))] text-sm text-[rgb(var(--fg-muted))] hover:border-[rgb(var(--color-primary,59_130_246))/0.4] hover:text-[rgb(var(--fg))] transition-colors"
                >
                  + Add goal
                </button>
              )}
            </div>
          </section>

          {/* AI Narrative */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))]">
                Strategic Narrative
              </h2>
              <button
                type="button"
                onClick={generateNarrative}
                disabled={generating || (!vision.trim() && goals.filter(g => g.title.trim()).length === 0)}
                className={[
                  'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all',
                  !generating && (vision.trim() || goals.some(g => g.title.trim()))
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                    : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] cursor-not-allowed',
                ].join(' ')}
              >
                {generating ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </>
                )}
              </button>
            </div>
            {generateError && (
              <div className="mb-2 text-xs text-red-600 dark:text-red-400 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                {generateError}
              </div>
            )}
            <textarea
              placeholder="A narrative that connects your current position to your future vision will appear here after you click Generate, or write your own…"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={8}
              name="ai_narrative"
              className="w-full text-sm px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] leading-relaxed"
            />
          </section>

          {/* Actions */}
          <div className="pt-2 pb-8 flex items-center justify-between">
            <a
              href={`/${tenantSlug}/future-state`}
              className="text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
            >
              ← Cancel
            </a>
            <button
              type="submit"
              disabled={isPending}
              className={[
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                !isPending
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
                  Save
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
