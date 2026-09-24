/**
 * Survey detail page — admin view.
 *
 * Shows:
 *   - Survey metadata and share link
 *   - Question list
 *   - Response count and individual responses
 *   - Edit form (title, description, status, questions)
 *   - Delete
 */
import { notFound, redirect } from 'next/navigation'
import { getSurvey, getSurveyResponses, updateSurvey, deleteSurvey } from '../actions'
import { STATUS_META } from '../types'
import Link from 'next/link'
import SurveyEditForm from './edit-form'
import { CopyButton } from './copy-button'

interface Props {
  params: { tenant: string; surveyId: string }
}

export async function generateMetadata({ params }: Props) {
  const { tenant, surveyId } = params
  const survey = await getSurvey(tenant, surveyId)
  return { title: survey?.title ?? 'Survey' }
}

export default async function SurveyDetailPage({ params }: Props) {
  const { tenant, surveyId } = await Promise.resolve(params)
  const [survey, responses] = await Promise.all([
    getSurvey(tenant, surveyId),
    getSurveyResponses(tenant, surveyId),
  ])

  if (!survey) notFound()

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL ?? 'localhost:3000'}`
  const shareUrl = `${origin}/survey/${survey.share_token}`

  const meta = STATUS_META[survey.status]

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateSurvey(tenant, surveyId, formData)
    redirect(`/${tenant}/surveys/${surveyId}`)
  }
  async function handleDelete() {
    'use server'
    await deleteSurvey(tenant, surveyId)
    redirect(`/${tenant}/surveys`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link href={`/${tenant}/surveys`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] transition-colors">
          ← Surveys
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">{survey.title}</h1>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
          </div>
          {survey.description && (
            <p className="text-sm text-[rgb(var(--text-2))] mt-1">{survey.description}</p>
          )}
          <p className="text-xs text-[rgb(var(--text-3))] mt-2">
            {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''} · {responses.length} response{responses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Share link */}
      {survey.status === 'active' && (
        <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-2">Share link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-[rgb(var(--text-1))] bg-[rgb(var(--bg))] rounded px-3 py-2 font-mono truncate border border-[rgb(var(--border))]">
              {shareUrl}
            </code>
            <CopyButton text={shareUrl} />
          </div>
          <p className="text-xs text-[rgb(var(--text-3))] mt-2">Anyone with this link can submit a response.</p>
        </div>
      )}

      {/* Questions preview */}
      {survey.questions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">Questions</h2>
          <ol className="space-y-2">
            {survey.questions.map((q, i) => (
              <li key={q.id} className="flex gap-3 p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                <span className="text-xs text-[rgb(var(--text-3))] shrink-0 w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[rgb(var(--text-1))]">{q.text}</p>
                  <p className="text-xs text-[rgb(var(--text-3))] mt-0.5 capitalize">{q.type === 'yesno' ? 'Yes / No' : q.type}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Responses */}
      {responses.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">Responses ({responses.length})</h2>
          <div className="space-y-4">
            {responses.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-1))]">
                      {r.respondent_name ?? 'Anonymous'}
                    </p>
                    {r.respondent_email && (
                      <p className="text-xs text-[rgb(var(--text-3))]">{r.respondent_email}</p>
                    )}
                  </div>
                  <p className="text-xs text-[rgb(var(--text-3))]">
                    {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-2">
                  {survey.questions.map((q) => (
                    <div key={q.id} className="text-xs">
                      <p className="text-[rgb(var(--text-3))] mb-0.5">{q.text}</p>
                      <p className="text-[rgb(var(--text-1))]">{r.data[q.id] ?? '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">Edit survey</h2>
        <SurveyEditForm survey={survey} updateAction={handleUpdate} />
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger zone</h2>
        <p className="text-sm text-[rgb(var(--text-2))] mb-4">Permanently delete this survey and all its responses.</p>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            Delete survey
          </button>
        </form>
      </div>
    </div>
  )
}
