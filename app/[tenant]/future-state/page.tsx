/**
 * Future State — dashboard page.
 *
 * Shows:
 *   - Vision statement
 *   - Strategic goals (up to 5, with horizon and description)
 *   - AI-generated narrative connecting current state to future state
 *
 * If no future state exists yet, shows an onboarding prompt.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFutureState } from './actions'

interface FutureStatePageProps {
  params: { tenant: string }
}

const HORIZON_COLORS: Record<string, string> = {
  '6 months': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  '12 months': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  '2 years': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  '3 years': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  '5 years': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default async function FutureStatePage({ params }: FutureStatePageProps) {
  const { tenant: tenantSlug } = params
  const data = await getFutureState(tenantSlug)

  if (data === null) notFound()

  const hasContent = data.vision || data.strategic_goals.length > 0
  const lastUpdated = data.updated_at
    ? new Date(data.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Future State</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            {hasContent
              ? `${data.strategic_goals.length} goal${data.strategic_goals.length !== 1 ? 's' : ''} defined${lastUpdated ? ` · Last updated ${lastUpdated}` : ''}`
              : 'Define your vision and strategic goals for where the organisation is heading.'}
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/future-state/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {hasContent ? 'Edit vision' : 'Define vision'}
        </Link>
      </div>

      {/* Empty state */}
      {!hasContent && (
        <div className="text-center py-20 border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--bg-subtle))] flex items-center justify-center">
            <svg className="w-6 h-6 text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-[rgb(var(--fg))]">No vision defined yet</h3>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))] max-w-sm mx-auto">
            Articulate where the organisation is heading and the strategic goals that will get you there.
          </p>
          <Link
            href={`/${tenantSlug}/future-state/edit`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Define vision
          </Link>
        </div>
      )}

      {hasContent && (
        <div className="space-y-8">
          {/* Vision */}
          {data.vision && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-3">
                Vision
              </h2>
              <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
                <blockquote className="text-lg leading-relaxed text-[rgb(var(--fg))] font-light italic">
                  "{data.vision}"
                </blockquote>
              </div>
            </section>
          )}

          {/* Strategic Goals */}
          {data.strategic_goals.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-3">
                Strategic Goals
              </h2>
              <div className="space-y-3">
                {data.strategic_goals.map((goal, idx) => (
                  <div
                    key={goal.id}
                    className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl px-5 py-4 flex gap-4"
                  >
                    <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[rgb(var(--color-primary,59_130_246))/0.1] flex items-center justify-center">
                      <span className="text-xs font-bold text-[rgb(var(--color-primary,59_130_246))]">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="font-medium text-[rgb(var(--fg))] text-sm">{goal.title}</span>
                        {goal.horizon && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${HORIZON_COLORS[goal.horizon] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {goal.horizon}
                          </span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="mt-1 text-xs text-[rgb(var(--fg-muted))] leading-relaxed">{goal.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI Narrative */}
          {data.ai_narrative && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))]">
                  Strategic Narrative
                </h2>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  AI-generated
                </span>
              </div>
              <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
                {data.ai_narrative.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-[rgb(var(--fg-muted))] leading-relaxed mb-4 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
