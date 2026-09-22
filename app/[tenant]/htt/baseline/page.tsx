'use client'

/**
 * HTT Baseline Diagnostic form.
 *
 * Walks the user through rating themselves 1–5 on each of the six
 * cognitive capabilities. Each level shows a concrete behavioural
 * description so ratings are anchored, not arbitrary.
 *
 * Submits to the `createBaseline` Server Action via a hidden form.
 */

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBaseline } from '../actions'

// ─── Capability definitions ──────────────────────────────────────────────────

interface LevelDesc {
  score: number
  label: string
  desc: string
}

interface CapabilityDef {
  key: string
  label: string
  summary: string
  levels: LevelDesc[]
}

const LEVEL_LABELS = ['Acquisition', 'Fluency', 'Maintenance', 'Generalisation', 'Adaptive']

const CAPABILITIES: CapabilityDef[] = [
  {
    key: 'critical_thinking',
    label: 'Critical Thinking',
    summary: 'Evaluating evidence, questioning assumptions, and reasoning to sound conclusions.',
    levels: [
      { score: 1, label: 'Acquisition',    desc: 'Accepts information at face value; rarely questions sources or underlying assumptions.' },
      { score: 2, label: 'Fluency',        desc: 'Begins to notice when evidence is weak; asks "why" when prompted by others.' },
      { score: 3, label: 'Maintenance',    desc: 'Regularly evaluates evidence quality and identifies logical gaps without prompting.' },
      { score: 4, label: 'Generalisation', desc: 'Applies structured reasoning frameworks independently across novel and complex domains.' },
      { score: 5, label: 'Adaptive',       desc: 'Evaluates entire reasoning systems; actively develops critical thinking capability in others.' },
    ],
  },
  {
    key: 'mental_models',
    label: 'Mental Models',
    summary: 'Building and applying conceptual frameworks to interpret complex situations.',
    levels: [
      { score: 1, label: 'Acquisition',    desc: 'Relies on intuition; no explicit mental frameworks are actively in use.' },
      { score: 2, label: 'Fluency',        desc: 'Uses one or two familiar models (e.g. SWOT, 80/20) when prompted.' },
      { score: 3, label: 'Maintenance',    desc: 'Actively builds a personal library of models and applies them routinely.' },
      { score: 4, label: 'Generalisation', desc: 'Selects the most useful model for each situation and combines models fluidly.' },
      { score: 5, label: 'Adaptive',       desc: 'Creates and refines new frameworks; evaluates and evolves the models themselves.' },
    ],
  },
  {
    key: 'perspective_taking',
    label: 'Perspective Taking',
    summary: 'Triarchic Intelligence — Analytical, Social, and Survival intelligences.',
    levels: [
      { score: 1, label: 'Acquisition',    desc: 'Sees situations primarily from own viewpoint; limited awareness of others\' frames.' },
      { score: 2, label: 'Fluency',        desc: 'Can describe others\' positions when asked; limited spontaneous application.' },
      { score: 3, label: 'Maintenance',    desc: 'Actively considers analytical, social, and survival perspectives before acting.' },
      { score: 4, label: 'Generalisation', desc: 'Shifts between the three intelligences naturally and in real time.' },
      { score: 5, label: 'Adaptive',       desc: 'Integrates triarchic intelligence into leadership and team development.' },
    ],
  },
  {
    key: 'adaptability',
    label: 'Adaptability',
    summary: 'Adjusting thinking and behaviour effectively as conditions change.',
    levels: [
      { score: 1, label: 'Acquisition',    desc: 'Relies on familiar approaches; resists or struggles with change.' },
      { score: 2, label: 'Fluency',        desc: 'Adjusts when given clear guidance; struggles in genuinely ambiguous situations.' },
      { score: 3, label: 'Maintenance',    desc: 'Adjusts thinking and approach without prompting when conditions shift.' },
      { score: 4, label: 'Generalisation', desc: 'Thrives in ambiguity; uses change as a signal to update frameworks and approaches.' },
      { score: 5, label: 'Adaptive',       desc: 'Designs environments that require and reward adaptability in others.' },
    ],
  },
  {
    key: 'independence',
    label: 'Independence',
    summary: 'Initiating and sustaining cognitive work without external direction.',
    levels: [
      { score: 1, label: 'Acquisition',    desc: 'Requires direction for most cognitive tasks; defers decision-making to others.' },
      { score: 2, label: 'Fluency',        desc: 'Initiates some tasks independently; still seeks frequent validation.' },
      { score: 3, label: 'Maintenance',    desc: 'Sustains cognitive effort on complex problems without external prompting.' },
      { score: 4, label: 'Generalisation', desc: 'Structures own inquiry, sets direction, and evaluates outcomes independently.' },
      { score: 5, label: 'Adaptive',       desc: 'Creates conditions that build intellectual independence in those around them.' },
    ],
  },
  {
    key: 'creativity',
    label: 'Creativity',
    summary: 'Generating novel solutions and seeing possibilities others miss.',
    levels: [
      { score: 1, label: 'Acquisition',    desc: 'Generates conventional responses; follows existing patterns and templates.' },
      { score: 2, label: 'Fluency',        desc: 'Offers variations on known solutions; some novel suggestions with prompting.' },
      { score: 3, label: 'Maintenance',    desc: 'Regularly proposes original approaches; comfortable with open-ended problems.' },
      { score: 4, label: 'Generalisation', desc: 'Connects concepts across distant domains; sees possibilities others consistently miss.' },
      { score: 5, label: 'Adaptive',       desc: 'Architects creative environments; generates paradigm-shifting insights.' },
    ],
  },
]

// ─── Colour helpers ──────────────────────────────────────────────────────────

function scoreColour(score: number): string {
  if (score <= 1) return 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
  if (score <= 2) return 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  if (score <= 3) return 'border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
  if (score <= 4) return 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  return 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
}

function scoreRingColour(score: number): string {
  if (score <= 1) return 'ring-gray-400'
  if (score <= 2) return 'ring-blue-500'
  if (score <= 3) return 'ring-violet-500'
  if (score <= 4) return 'ring-amber-500'
  return 'ring-emerald-500'
}

// ─── Capability card ─────────────────────────────────────────────────────────

function CapabilityCard({
  cap,
  selected,
  onSelect,
}: {
  cap: CapabilityDef
  selected: number | null
  onSelect: (score: number) => void
}) {
  return (
    <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{cap.label}</h2>
        {selected !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreColour(selected)}`}>
            {LEVEL_LABELS[selected - 1]}
          </span>
        )}
      </div>
      <p className="text-xs text-[rgb(var(--fg-muted))] mb-4 leading-relaxed">{cap.summary}</p>

      {/* Rating tiles */}
      <div className="grid grid-cols-5 gap-2">
        {cap.levels.map((level) => {
          const isSelected = selected === level.score
          return (
            <button
              key={level.score}
              type="button"
              onClick={() => onSelect(level.score)}
              className={[
                'relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 text-center transition-all',
                isSelected
                  ? `${scoreColour(level.score)} ${scoreRingColour(level.score)} ring-2 ring-offset-1`
                  : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-primary,59_130_246))/0.5] hover:bg-[rgb(var(--bg-card))]',
              ].join(' ')}
            >
              <span className={`text-lg font-bold ${isSelected ? '' : 'text-[rgb(var(--fg-muted))]'}`}>
                {level.score}
              </span>
              <span className={`text-[9px] font-semibold uppercase tracking-wide leading-tight ${isSelected ? '' : 'text-[rgb(var(--fg-muted))]'}`}>
                {level.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Description of selected level */}
      {selected !== null && (
        <div className={`mt-3 px-3 py-2.5 rounded-lg border text-xs leading-relaxed ${scoreColour(selected)}`}>
          <span className="font-semibold">{cap.levels[selected - 1].label}: </span>
          {cap.levels[selected - 1].desc}
        </div>
      )}
    </div>
  )
}

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressDots({ scores }: { scores: Record<string, number | null> }) {
  const total = CAPABILITIES.length
  const done = Object.values(scores).filter((v) => v !== null).length
  return (
    <div className="flex items-center gap-1.5">
      {CAPABILITIES.map((cap) => {
        const val = scores[cap.key]
        return (
          <div
            key={cap.key}
            className={`h-1.5 rounded-full flex-1 transition-all ${
              val !== null ? 'bg-[rgb(var(--color-primary,59_130_246))]' : 'bg-[rgb(var(--border))]'
            }`}
          />
        )
      })}
      <span className="text-xs text-[rgb(var(--fg-muted))] ml-1 flex-shrink-0 tabular-nums">{done}/{total}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BaselinePage() {
  const params = useParams<{ tenant: string }>()
  const tenantSlug = params.tenant

  const [scores, setScores] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(CAPABILITIES.map((c) => [c.key, null]))
  )
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const allRated = Object.values(scores).every((v) => v !== null)

  function handleSelect(key: string, score: number) {
    setScores((prev) => ({ ...prev, [key]: score }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allRated || submitting) return
    setSubmitting(true)

    const fd = new FormData()
    for (const [key, val] of Object.entries(scores)) {
      fd.append(key, String(val))
    }

    try {
      await createBaseline(tenantSlug, fd)
    } catch {
      // createBaseline calls redirect() which throws NEXT_REDIRECT — that's expected
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-4">
          <a href={`/${tenantSlug}/htt`} className="hover:text-[rgb(var(--fg))] transition-colors">
            How to Think
          </a>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[rgb(var(--fg))]">Baseline Diagnostic</span>
        </nav>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Baseline Diagnostic</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))] max-w-xl">
          Rate yourself honestly on each capability. Select the description that best reflects how you <em>consistently</em> operate — not your best day, not your worst.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressDots scores={scores} />
      </div>

      {/* Capability cards */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden inputs that hold the scores */}
        {CAPABILITIES.map((cap) => (
          <input
            key={cap.key}
            type="hidden"
            name={cap.key}
            value={scores[cap.key] ?? ''}
          />
        ))}

        {CAPABILITIES.map((cap) => (
          <CapabilityCard
            key={cap.key}
            cap={cap}
            selected={scores[cap.key]}
            onSelect={(score) => handleSelect(cap.key, score)}
          />
        ))}

        {/* Submit */}
        <div className="pt-2 pb-8">
          {!allRated && (
            <p className="text-xs text-[rgb(var(--fg-muted))] mb-4 text-center">
              Rate all six capabilities to continue.
            </p>
          )}
          <div className="flex items-center justify-between">
            <a
              href={`/${tenantSlug}/htt`}
              className="text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
            >
              ← Cancel
            </a>
            <button
              type="submit"
              disabled={!allRated || submitting}
              className={[
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                allRated && !submitting
                  ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white hover:opacity-90'
                  : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] cursor-not-allowed',
              ].join(' ')}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  Save baseline
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
