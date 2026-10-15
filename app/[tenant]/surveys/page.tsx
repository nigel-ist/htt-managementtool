/**
 * Surveys list page.
 *
 * Shows all surveys for the tenant with status badges and response counts.
 * Includes a "Load Standard Assessments" button that seeds Think + Feel surveys.
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'
import type { Survey } from '@/app/[tenant]/surveys/types'
import { STATUS_META, SURVEY_STATUSES } from '@/app/[tenant]/surveys/types'
import SeedSurveysButton from './_components/SeedSurveysButton'

interface SurveysPageProps {
  params: { tenant: string }
}

async function getSurveys(tenantSlug: string): Promise<Survey[] | null> {
  const claims = await getServerJWTClaims()
  if (!claims) return null

  const supabase = await createClient()

  let tenantId = claims.tenant_id
  if (!tenantId) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    tenantId = data?.id ?? null
  }
  if (!tenantId) return null

  const { data, error } = await supabase
    .from('surveys')
    .select('id, title, description, status, survey_type, questions, scoring_config, share_token, created_by, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[surveys/page] query error:', error)
    return null
  }

  // Fetch response counts for each survey
  const surveyIds = (data ?? []).map((s: Survey) => s.id)
  let countMap: Record<string, number> = {}
  if (surveyIds.length > 0) {
    const { data: counts } = await supabase
      .from('survey_responses')
      .select('survey_id')
      .in('survey_id', surveyIds)

    for (const row of counts ?? []) {
      countMap[row.survey_id] = (countMap[row.survey_id] ?? 0) + 1
    }
  }

  return (data ?? []).map((s: Survey) => ({ ...s, response_count: countMap[s.id] ?? 0 }))
}

const SURVEY_TYPE_LABEL: Record<string, string> = {
  standard: 'Standard',
  industry_assessment: 'Industry Assessment',
}

export default async function SurveysPage({ params }: SurveysPageProps) {
  const { tenant: tenantSlug } = params
  const surveys = await getSurveys(tenantSlug)

  if (surveys === null) notFound()

  const isEmpty = surveys.length === 0
  const byStatus = SURVEY_STATUSES.reduce<Record<string, Survey[]>>((acc, s) => {
    acc[s] = surveys.filter(sv => sv.status === s)
    return acc
  }, {})

  const activeCount = byStatus['active']?.length ?? 0
  const totalResponses = surveys.reduce((sum, s) => sum + (s.response_count ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Surveys</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            {isEmpty
              ? 'Assessments for your team. Load the standard assessments to get started.'
              : `${activeCount} active · ${totalResponses} total responses`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Seed standard assessments */}
          <SeedSurveysButton tenantSlug={tenantSlug} />
          {/* New survey (manual) */}
          <Link
            href={`/${tenantSlug}/surveys/new`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New survey
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-20 border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--bg-subtle))] flex items-center justify-center">
            <svg className="w-6 h-6 text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-[rgb(var(--fg))]">No surveys yet</h3>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))] max-w-xs mx-auto">
            Load the Think and Feel standard assessments, or create a custom survey.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <SeedSurveysButton tenantSlug={tenantSlug} />
          </div>
        </div>
      )}

      {/* Survey list */}
      {!isEmpty && (
        <div className="space-y-8">
          {SURVEY_STATUSES.map(status => {
            const items = byStatus[status] ?? []
            if (items.length === 0) return null
            const meta = STATUS_META[status]
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-[rgb(var(--fg-muted))]">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(survey => (
                    <Link
                      key={survey.id}
                      href={`/${tenantSlug}/surveys/${survey.id}`}
                      className="group flex flex-col gap-1.5 bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-4 hover:border-[rgb(var(--color-primary,59_130_246))] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[rgb(var(--fg))] group-hover:text-[rgb(var(--color-primary,59_130_246))] transition-colors leading-snug">
                          {survey.title}
                        </p>
                        <span className="shrink-0 text-xs text-[rgb(var(--fg-muted))] bg-[rgb(var(--bg-subtle))] rounded px-1.5 py-0.5">
                          {SURVEY_TYPE_LABEL[survey.survey_type] ?? survey.survey_type}
                        </span>
                      </div>
                      {survey.description && (
                        <p className="text-xs text-[rgb(var(--fg-muted))] line-clamp-2">{survey.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-[rgb(var(--fg-muted))]">
                        <span>{survey.questions?.length ?? 0} questions</span>
                        {survey.scoring_config && (
                          <span className="flex items-center gap-0.5">
                            <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                            Scored
                          </span>
                        )}
                        <span>{survey.response_count ?? 0} {(survey.response_count ?? 0) === 1 ? 'response' : 'responses'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
