/**
 * Edit / delete innovation page.
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'
import { updateInnovation, deleteInnovation } from '../actions'

interface EditInnovationPageProps {
  params: { tenant: string; id: string }
}

interface Innovation {
  id: string
  title: string
  stage: string
  data: { description?: string | null } | null
}

const STAGES = [
  { value: 'idea',    label: 'Idea' },
  { value: 'explore', label: 'Explore' },
  { value: 'develop', label: 'Develop' },
  { value: 'pilot',   label: 'Pilot' },
  { value: 'scale',   label: 'Scale' },
  { value: 'shelved', label: 'Shelved' },
]

const STAGE_FLOW = ['idea', 'explore', 'develop', 'pilot', 'scale']

async function getInnovation(tenantSlug: string, innovationId: string): Promise<Innovation | null> {
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
    .from('innovations')
    .select('id, title, stage, data')
    .eq('id', innovationId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) return null
  return data
}

export default async function EditInnovationPage({ params }: EditInnovationPageProps) {
  const { tenant: tenantSlug, id: innovationId } = params
  const innovation = await getInnovation(tenantSlug, innovationId)

  if (!innovation) notFound()

  const updateAction = updateInnovation.bind(null, tenantSlug, innovationId)
  const deleteAction = deleteInnovation.bind(null, tenantSlug, innovationId)

  const currentStageIndex = STAGE_FLOW.indexOf(innovation.stage)
  const nextStage = currentStageIndex >= 0 && currentStageIndex < STAGE_FLOW.length - 1
    ? STAGE_FLOW[currentStageIndex + 1]
    : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-6">
        <Link href={`/${tenantSlug}/innovations`} className="hover:text-[rgb(var(--fg))] transition-colors">
          Innovations
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[rgb(var(--fg))] truncate max-w-[200px]">{innovation.title}</span>
      </nav>

      {/* Stage pipeline indicator */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {STAGE_FLOW.map((stage, i) => {
          const config = STAGES.find(s => s.value === stage)!
          const isCurrent = innovation.stage === stage
          const isPast = STAGE_FLOW.indexOf(innovation.stage) > i
          return (
            <div key={stage} className="flex items-center gap-1 flex-shrink-0">
              <div className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white'
                  : isPast
                    ? 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] line-through'
                    : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]'
              }`}>
                {config.label}
              </div>
              {i < STAGE_FLOW.length - 1 && (
                <svg className="w-3 h-3 text-[rgb(var(--border))] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          )
        })}
      </div>

      {/* Edit form */}
      <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-6">
        <h1 className="text-xl font-semibold text-[rgb(var(--fg))] mb-6">Edit innovation</h1>

        <form action={updateAction} className="space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[rgb(var(--fg))] mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={innovation.title}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
            />
          </div>

          {/* Stage */}
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-[rgb(var(--fg))] mb-1.5">
              Stage <span className="text-red-500">*</span>
            </label>
            <select
              id="stage"
              name="stage"
              required
              defaultValue={innovation.stage}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
            >
              {STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {nextStage && (
              <p className="mt-1.5 text-xs text-[rgb(var(--fg-muted))]">
                Next stage: <span className="font-medium capitalize">{nextStage}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[rgb(var(--fg))] mb-1.5">
              Description <span className="text-[rgb(var(--fg-muted))] font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={innovation.data?.description ?? ''}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/${tenantSlug}/innovations`}
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger zone</h2>
        <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">
          Permanently delete this innovation. This action cannot be undone.
        </p>
        <form action={deleteAction}>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Delete innovation
          </button>
        </form>
      </div>
    </div>
  )
}
