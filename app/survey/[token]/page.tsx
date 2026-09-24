/**
 * Public survey response page — /survey/[token]
 *
 * No authentication required. Accessible via the share link.
 * Submits to POST /api/surveys/respond.
 */
import { notFound } from 'next/navigation'
import { getSurveyByToken } from '@/app/[tenant]/surveys/actions'
import SurveyResponseForm from './form'

interface Props {
  params: { token: string }
}

export async function generateMetadata({ params }: Props) {
  const survey = await getSurveyByToken(params.token)
  return { title: survey?.title ?? 'Survey' }
}

export default async function PublicSurveyPage({ params }: Props) {
  const { token } = await Promise.resolve(params)
  const survey = await getSurveyByToken(token)

  if (!survey) notFound()

  return (
    <div className="min-h-screen bg-[rgb(var(--bg,248_248_250))] py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1,15_15_20))]">{survey.title}</h1>
          {survey.description && (
            <p className="mt-2 text-sm text-[rgb(var(--text-2,100_100_115))] leading-relaxed">
              {survey.description}
            </p>
          )}
        </div>

        {survey.status !== 'active' ? (
          <div className="p-6 rounded-2xl border border-[rgb(var(--border,220_220_228))] bg-white dark:bg-[rgb(var(--surface,30_30_40))] text-center">
            <p className="text-sm text-[rgb(var(--text-2,100_100_115))]">
              {survey.status === 'closed'
                ? 'This survey has closed and is no longer accepting responses.'
                : 'This survey is not yet open for responses.'}
            </p>
          </div>
        ) : survey.questions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-[rgb(var(--border,220_220_228))] bg-white dark:bg-[rgb(var(--surface,30_30_40))] text-center">
            <p className="text-sm text-[rgb(var(--text-2,100_100_115))]">
              This survey has no questions yet.
            </p>
          </div>
        ) : (
          <SurveyResponseForm survey={survey} token={token} />
        )}
      </div>
    </div>
  )
}
