'use client'

import { useState } from 'react'
import type { Survey, SurveyResponse } from '@/app/[tenant]/surveys/types'
import type { SurveyScoreResult } from '@/lib/surveys/scoring'
import { bandColorClass } from '@/lib/surveys/scoring'

interface ScoredResponse {
  response: SurveyResponse
  scores: SurveyScoreResult | null
}

interface SurveyResponsesTableProps {
  survey: Survey
  scoredResponses: ScoredResponse[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SurveyResponsesTable({ survey, scoredResponses }: SurveyResponsesTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const hasScoring = !!survey.scoring_config

  return (
    <div className="border border-[rgb(var(--border))] rounded-xl overflow-hidden">
      {scoredResponses.map(({ response, scores }, idx) => {
        const isExpanded = expanded === response.id
        const respondentLabel = response.respondent_name
          ? response.respondent_name
          : response.respondent_email ?? `Response ${idx + 1}`
        const composite = scores?.composite ?? null
        const compositeBand = scores?.compositeBand ?? null

        return (
          <div
            key={response.id}
            className={`border-b border-[rgb(var(--border))] last:border-0 ${isExpanded ? 'bg-[rgb(var(--bg-subtle))]' : ''}`}
          >
            {/* Row header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : response.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-[rgb(var(--bg-subtle))] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[rgb(var(--color-primary,59_130_246))]/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[rgb(var(--color-primary,59_130_246))]">
                    {respondentLabel.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{respondentLabel}</p>
                  {response.respondent_email && response.respondent_name && (
                    <p className="text-xs text-[rgb(var(--fg-muted))] truncate">{response.respondent_email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Composite score pill */}
                {composite !== null && (
                  <div className="flex items-center gap-1.5">
                    {compositeBand && (
                      <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${bandColorClass(compositeBand.label)}`}>
                        {compositeBand.label}
                      </span>
                    )}
                    <span className="text-sm font-semibold tabular-nums text-[rgb(var(--fg))]">{composite}</span>
                  </div>
                )}
                {/* If no composite, show question count answered */}
                {composite === null && hasScoring && (
                  <span className="text-xs text-[rgb(var(--fg-muted))]">
                    {Object.keys(response.data).length}/{survey.questions.length}
                  </span>
                )}
                <span className="text-xs text-[rgb(var(--fg-muted))]">{formatDate(response.created_at)}</span>
                <svg
                  className={`w-4 h-4 text-[rgb(var(--fg-muted))] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && scores && (
              <div className="px-5 pb-5">
                {/* Composite band description */}
                {scores.compositeBand?.description && (
                  <div className="mb-4 p-3 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-lg">
                    <p className="text-xs font-medium text-[rgb(var(--fg))] mb-0.5">{scores.compositeBand.label}</p>
                    <p className="text-xs text-[rgb(var(--fg-muted))]">{scores.compositeBand.description}</p>
                  </div>
                )}

                {/* Subscale scores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {scores.subscales.map(sub => {
                    const displayScore = sub.normalized ?? sub.raw
                    const config = survey.scoring_config!
                    const subConfig = config.subscales.find(s => s.id === sub.id)
                    const normalize = subConfig?.normalize !== false
                    const rawMin = subConfig?.raw_min ?? 0
                    const rawMax = subConfig?.raw_max ?? 100
                    const pct = normalize
                      ? displayScore
                      : Math.round(((sub.raw - rawMin) / (rawMax - rawMin)) * 100)

                    return (
                      <div key={sub.id} className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-lg px-3 py-2.5">
                        <p className="text-[10px] text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-1 leading-tight">{sub.name}</p>
                        <p className="text-base font-semibold tabular-nums text-[rgb(var(--fg))]">{displayScore}</p>
                        {sub.band && (
                          <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${bandColorClass(sub.band.label)}`}>
                            {sub.band.label}
                          </span>
                        )}
                        <div className="mt-2 h-1 bg-[rgb(var(--bg-subtle))] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[rgb(var(--color-primary,59_130_246))] rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                        {sub.band?.description && (
                          <p className="mt-1.5 text-[10px] text-[rgb(var(--fg-muted))] leading-snug">{sub.band.description}</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Higher-order groupings */}
                {scores.higher_order && Object.keys(scores.higher_order).length > 0 && (
                  <div className="pt-3 border-t border-[rgb(var(--border))]">
                    <p className="text-xs font-medium text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-2">Higher-order</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(scores.higher_order).map(([group, val]) => (
                        <div key={group} className="flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-lg">
                          <span className="text-xs text-[rgb(var(--fg-muted))]">{group}</span>
                          <span className="text-sm font-semibold tabular-nums text-[rgb(var(--fg))]">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
