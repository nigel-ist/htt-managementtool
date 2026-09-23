import { getSurveys } from './actions'
import { STATUS_META } from './types'
import Link from 'next/link'

export default async function SurveysPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const surveys = await getSurveys(tenant)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Surveys</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Create and manage feedback surveys</p>
        </div>
        <Link href={`/${tenant}/surveys/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          + New Survey
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No surveys yet</p>
          <p className="text-sm">Create your first survey to start collecting feedback.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => {
            const meta = STATUS_META[s.status]
            return (
              <Link
                key={s.id}
                href={`/${tenant}/surveys/${s.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-[rgb(var(--text-1))] truncate">{s.title}</h2>
                  {s.description && <p className="text-sm text-[rgb(var(--text-2))] mt-0.5 truncate">{s.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm text-[rgb(var(--text-2))] hidden sm:block">
                    {s.response_count} {s.response_count === 1 ? 'response' : 'responses'}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
