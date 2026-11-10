/**
 * Survey detail page — shows survey info, responses, and computed scores.
 *
 * Layout:
 *   - Survey header (title, status badge, share link, question count)
 *   - Scoring overview (subscales, composite, bands) if scoring_config present
 *   - Response list with per-response score breakdown
 *   - Collapsible edit form (status change / delete)
 *   - Import buttons (CSV responses, AI doc parse)
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { Survey, SurveyResponse } from '@/app/[tenant]/surveys/types'
import { STATUS_META, SURVEY_STATUSES } from '@/app/[tenant]/surveys/types'
import { computeScores, bandColorClass } from '@/lib/surveys/scoring'
import { updateSurveyStatus, deleteSurvey } from '@/app/[tenant]/surveys/actions'
import SurveyResponsesTable from './_components/SurveyResponsesTable'
import ImportResponsesPanel from './_components/ImportResponsesPanel'

interface SurveyDetailPageProps {
  params: { tenant: string; surveyId: string }
}

async function getSurveyWithResponses(tenantSlug: string, surveyId: string) {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const supabase = createServiceClient()

  let tenantId = claims.tenant_id
  if (!tenantId) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    tenantId = data?.id ?? null
  }
  if (!tenantId) return null

  const { data: survey, error } = await supabase
    .from('surveys')
    .select('id, title, description, status, survey_type, questions, scoring_config, share_token, created_by, created_at, updated_at')
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !survey) return null

  const { data: responses } = await supabase
    .from('survey_responses')
    .select('id, survey_id, respondent_name, respondent_email, data, created_at')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false })

  return { survey: survey as Survey, responses: (responses ?? []) as SurveyResponse[] }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { tenant: tenantSlug, surveyId } = params
  const data = await getSurveyWithResponses(tenantSlug, surveyId)
  if (!data) notFound()

  const { survey, responses } = data
  const statusMeta = STATUS_META[survey.status]
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/survey/${survey.share_token}`
  const hasScoring = !!survey.scoring_config
  const questionCount = survey.questions?.length ?? 0

  // Compute scores for all responses
  const scoredResponses = responses.map(r => ({
    response: r,
    scores: hasScoring ? computeScores(survey, r) : null,
  }))

  // Aggregate subscale averages across all responses (for the overview)
  const subscaleAverages: Record<string, number[]> = {}
  for (const { scores } of scoredResponses) {
    if (!scores) continue
    for (const sub of scores.subscales) {
      if (!subscaleAverages[sub.id]) subscaleAverages[sub.id] = []
      subscaleAverages[sub.id].push(sub.normalized ?? sub.raw)
    }
  }
  const subscaleAvg = Object.fromEntries(
    Object.entries(subscaleAverages).map(([id, vals]) => [
      id,
      Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
    ])
  )

  const compositeValues = scoredResponses.map(r => r.scores?.composite).filter((v): v is number => v !== null)
  const avgComposite = compositeValues.length > 0
    ? Math.round((compositeValues.reduce((a, b) => a + b, 0) / compositeValues.length) * 10) / 10
    : null

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-6">
        <Link href={`/${tenantSlug}/surveys`} className="hover:text-[rgb(var(--fg))] transition-colors">
          Surveys
        </Link>
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-[rgb(var(--fg))] font-medium line-clamp-1">{survey.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">{survey.title}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          </div>
          {survey.description && (
            <p className="text-sm text-[rgb(var(--fg-muted))] mt-1">{survey.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[rgb(var(--fg-muted))]">
            <span>{questionCount} questions</span>
            <span>{responses.length} {responses.length === 1 ? 'response' : 'responses'}</span>
            {hasScoring && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Scored assessment
              </span>
            )}
            <span>Created {formatDate(survey.created_at)}</span>
          </div>
        </div>
        {/* Share link */}
        {survey.status === 'active' && (
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-xs font-medium text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            Share link
          </a>
        )}
      </div>

      {/* ── Scoring overview (aggregate) ──────────────────────────────────── */}
      {hasScoring && responses.length > 0 && survey.scoring_config && (
        <div className="mb-8 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgb(var(--border))]">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">
              Group averages
              <span className="ml-2 font-normal text-[rgb(var(--fg-muted))]">({responses.length} {responses.length === 1 ? 'respondent' : 'respondents'})</span>
            </h2>
          </div>

          {/* Composite score */}
          {avgComposite !== null && survey.scoring_config.composite && (
            <div className="px-5 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-0.5">
                  {survey.scoring_config.composite.name}
                </p>
                <p className="text-2xl font-bold text-[rgb(var(--fg))]">{avgComposite}</p>
              </div>
              {/* Mini gauge */}
              <div className="flex-1 max-w-xs">
                <div className="relative h-2 bg-[rgb(var(--bg-subtle))] rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[rgb(var(--color-primary,59_130_246))] rounded-full transition-all"
                    style={{ width: `${avgComposite}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-[rgb(var(--fg-muted))]">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          )}

          {/* Subscale grid */}
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {survey.scoring_config.subscales.map(sub => {
                const avg = subscaleAvg[sub.id]
                if (avg === undefined) return null
                const normalize = sub.normalize !== false
                const pct = normalize ? avg : Math.round(((avg - sub.raw_min) / (sub.raw_max - sub.raw_min)) * 100)
                // find band for this avg score
                const band = survey.scoring_config!.bands.find(
                  b => b.subscale_id === sub.id && avg >= b.min && avg <= b.max
                )
                return (
                  <div key={sub.id} className="bg-[rgb(var(--bg-subtle))] rounded-lg px-3 py-2.5">
                    <p className="text-xs text-[rgb(var(--fg-muted))] mb-1 leading-snug">{sub.name}</p>
                    <p className="text-lg font-semibold text-[rgb(var(--fg))]">{avg}</p>
                    {band && (
                      <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${bandColorClass(band.label)}`}>
                        {band.label}
                      </span>
                    )}
                    <div className="mt-2 h-1 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[rgb(var(--color-primary,59_130_246))] rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Higher-order groupings */}
            {survey.scoring_config.higher_order && Object.keys(survey.scoring_config.higher_order).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
                <p className="text-xs font-medium text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-3">Higher-order values</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(survey.scoring_config.higher_order).map(([groupName, subIds]) => {
                    const total = (scoredResponses.length > 0)
                      ? Math.round(
                          scoredResponses.reduce((sum, r) => sum + (r.scores?.higher_order?.[groupName] ?? 0), 0)
                          / scoredResponses.length * 10
                        ) / 10
                      : null
                    return (
                      <div key={groupName} className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--bg-subtle))] rounded-lg">
                        <span className="text-xs text-[rgb(var(--fg-muted))]">{groupName}</span>
                        {total !== null && <span className="text-sm font-semibold text-[rgb(var(--fg))]">{total}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Response list ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">
            Responses
            {responses.length > 0 && (
              <span className="ml-2 font-normal text-[rgb(var(--fg-muted))]">({responses.length})</span>
            )}
          </h2>
          {/* Import button */}
          <ImportResponsesPanel surveyId={survey.id} tenantSlug={tenantSlug} />
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[rgb(var(--border))] rounded-xl">
            <p className="text-sm text-[rgb(var(--fg-muted))]">No responses yet.</p>
            {survey.status === 'active' ? (
              <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">Share the survey link to collect responses.</p>
            ) : (
              <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">Activate the survey to start collecting responses.</p>
            )}
          </div>
        ) : (
          <SurveyResponsesTable
            survey={survey}
            scoredResponses={scoredResponses}
          />
        )}
      </div>

      {/* ── Collapsible edit / status / delete ────────────────────────────── */}
      <details className="group mb-6 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between cursor-pointer px-5 py-4 select-none hover:bg-[rgb(var(--bg-subtle))] transition-colors">
          <span className="text-sm font-medium text-[rgb(var(--fg))]">Manage survey</span>
          <svg className="w-4 h-4 text-[rgb(var(--fg-muted))] transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </summary>
        <div className="px-5 py-4 border-t border-[rgb(var(--border))] space-y-6">
          {/* Status change */}
          <div>
            <p className="text-xs font-medium text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-3">Status</p>
            <form className="flex flex-wrap gap-2" action={async (fd: FormData) => {
              'use server'
              const s = fd.get('status') as string
              await updateSurveyStatus(tenantSlug, survey.id, s as any)
            }}>
              {SURVEY_STATUSES.map(s => (
                <button
                  key={s}
                  type="submit"
                  name="status"
                  value={s}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    survey.status === s
                      ? `${STATUS_META[s].color} border-transparent`
                      : 'border-[rgb(var(--border))] text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))]'
                  }`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </form>
            {survey.status === 'active' && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-[rgb(var(--bg-subtle))] rounded-lg">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-[rgb(var(--fg-muted))]">
                  Share link active:{' '}
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[rgb(var(--fg))]">
                    {shareUrl}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="border-t border-red-200 dark:border-red-900/30 pt-4">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">Danger zone</p>
            <form action={async () => {
              'use server'
              await deleteSurvey(tenantSlug, survey.id)
            }}>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={(e) => {
                  if (!confirm('Delete this survey and all responses? This cannot be undone.')) e.preventDefault()
                }}
              >
                Delete survey
              </button>
            </form>
          </div>
        </div>
      </details>
    </div>
  )
}
