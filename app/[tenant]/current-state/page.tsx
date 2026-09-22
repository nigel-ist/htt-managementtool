/**
 * Current State — dashboard page.
 *
 * Shows scored assessments across three categories:
 *   Strategic · Operational · Financial
 *
 * Each category displays its five dimensions as scored bars.
 * An average score per category is shown as a summary tile.
 *
 * If no scores exist yet, shows an onboarding prompt.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentState } from './actions'
import { CATEGORIES, type CurrentStateData } from './types'

interface CurrentStatePageProps {
  params: { tenant: string }
}

// ─── Score colours ────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score <= 1) return 'bg-red-400'
  if (score <= 2) return 'bg-orange-400'
  if (score <= 3) return 'bg-amber-400'
  if (score <= 4) return 'bg-blue-400'
  return 'bg-emerald-400'
}

function scoreBadge(score: number): string {
  if (score <= 1) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (score <= 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  if (score <= 3) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  if (score <= 4) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
}

function scoreLabel(score: number): string {
  if (score <= 1) return 'Critical'
  if (score <= 2) return 'Needs Work'
  if (score <= 3) return 'Developing'
  if (score <= 4) return 'Strong'
  return 'Excellent'
}

// ─── Category card ────────────────────────────────────────────────

function CategoryCard({
  category,
  scores,
}: {
  category: { key: string; label: string; dimensions: string[] }
  scores: CurrentStateData['scores']
}) {
  const catScores = scores.filter((s) => s.category === category.key)
  const scoreMap = Object.fromEntries(catScores.map((s) => [s.dimension, s]))

  const ratedScores = catScores.map((s) => s.score)
  const avg = ratedScores.length > 0
    ? ratedScores.reduce((a, b) => a + b, 0) / ratedScores.length
    : null

  return (
    <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
      {/* Category header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{category.label}</h2>
          <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">
            {ratedScores.length}/{category.dimensions.length} dimensions assessed
          </p>
        </div>
        {avg !== null && (
          <div className="text-right">
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scoreBadge(Math.round(avg))}`}>
              {avg.toFixed(1)} avg
            </div>
          </div>
        )}
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        {category.dimensions.map((dim) => {
          const entry = scoreMap[dim]
          const score = entry?.score ?? null
          return (
            <div key={dim}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[rgb(var(--fg))]">{dim}</span>
                {score !== null ? (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${scoreBadge(score)}`}>
                    {score}/5 · {scoreLabel(score)}
                  </span>
                ) : (
                  <span className="text-[10px] text-[rgb(var(--fg-muted))]">Not rated</span>
                )}
              </div>
              {/* Bar */}
              <div className="h-1.5 rounded-full bg-[rgb(var(--border))] overflow-hidden">
                {score !== null && (
                  <div
                    className={`h-full rounded-full transition-all ${scoreColor(score)}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                )}
              </div>
              {entry?.notes && (
                <p className="mt-1 text-[10px] text-[rgb(var(--fg-muted))] leading-relaxed italic">
                  {entry.notes}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function CurrentStatePage({ params }: CurrentStatePageProps) {
  const { tenant: tenantSlug } = params
  const data = await getCurrentState(tenantSlug)

  if (data === null) notFound()

  const hasScores = data.scores.length > 0
  const totalDimensions = CATEGORIES.reduce((n, c) => n + c.dimensions.length, 0)
  const allScores = data.scores.map((s) => s.score)
  const overallAvg =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : null

  const lastUpdated = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Current State</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            {hasScores
              ? `${data.scores.length}/${totalDimensions} dimensions rated${lastUpdated ? ` · Last updated ${lastUpdated}` : ''}`
              : 'Assess where your organisation stands today across 15 dimensions.'}
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/current-state/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {hasScores ? 'Update assessment' : 'Begin assessment'}
        </Link>
      </div>

      {/* Empty state */}
      {!hasScores && (
        <div className="text-center py-20 border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--bg-subtle))] flex items-center justify-center">
            <svg className="w-6 h-6 text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-[rgb(var(--fg))]">No assessment yet</h3>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))] max-w-sm mx-auto">
            Score your organisation across 15 strategic, operational, and financial dimensions.
          </p>
          <Link
            href={`/${tenantSlug}/current-state/edit`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Begin assessment
          </Link>
        </div>
      )}

      {/* Summary tiles */}
      {hasScores && overallAvg !== null && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="col-span-1 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-[rgb(var(--fg))] tabular-nums">{overallAvg.toFixed(1)}</div>
            <div className="text-xs text-[rgb(var(--fg-muted))] mt-1">Overall avg</div>
            <div className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${scoreBadge(Math.round(overallAvg))}`}>
              {scoreLabel(Math.round(overallAvg))}
            </div>
          </div>
          {CATEGORIES.map((cat) => {
            const catScores = data.scores
              .filter((s) => s.category === cat.key)
              .map((s) => s.score)
            const catAvg =
              catScores.length > 0
                ? catScores.reduce((a, b) => a + b, 0) / catScores.length
                : null
            return (
              <div key={cat.key} className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-[rgb(var(--fg))] tabular-nums">
                  {catAvg !== null ? catAvg.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-[rgb(var(--fg-muted))] mt-1">{cat.label}</div>
                {catAvg !== null && (
                  <div className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${scoreBadge(Math.round(catAvg))}`}>
                    {scoreLabel(Math.round(catAvg))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Category cards */}
      {hasScores && (
        <div className="grid grid-cols-1 gap-6">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.key} category={cat} scores={data.scores} />
          ))}
        </div>
      )}
    </div>
  )
}
