/**
 * Innovations list page — pipeline view grouped by stage.
 *
 * Stages (left → right in a pipeline):
 *   idea → explore → develop → pilot → scale → shelved
 *
 * Each stage column shows its innovations as cards.
 * On narrow screens the columns stack vertically.
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'

interface InnovationsPageProps {
  params: { tenant: string }
}

interface Innovation {
  id: string
  title: string
  stage: string
  data: { description?: string | null } | null
  created_at: string
}

const STAGES: {
  key: string
  label: string
  color: string
  dot: string
}[] = [
  { key: 'idea',    label: 'Idea',    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300', dot: 'bg-violet-400' },
  { key: 'explore', label: 'Explore', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',         dot: 'bg-blue-400' },
  { key: 'develop', label: 'Develop', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',     dot: 'bg-amber-400' },
  { key: 'pilot',   label: 'Pilot',   color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-400' },
  { key: 'scale',   label: 'Scale',   color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-400' },
  { key: 'shelved', label: 'Shelved', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',            dot: 'bg-gray-400' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))

async function getInnovations(tenantSlug: string): Promise<Innovation[] | null> {
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
    .select('id, title, stage, data, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[innovations/page] query error:', error)
    return null
  }

  return data ?? []
}

export default async function InnovationsPage({ params }: InnovationsPageProps) {
  const { tenant: tenantSlug } = params
  const innovations = await getInnovations(tenantSlug)

  if (innovations === null) notFound()

  // Group by stage
  const grouped = innovations.reduce<Record<string, Innovation[]>>((acc, item) => {
    const key = item.stage in STAGE_MAP ? item.stage : 'shelved'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const isEmpty = innovations.length === 0
  const totalActive = innovations.filter(i => i.stage !== 'shelved').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Innovations</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            {isEmpty
              ? 'Track ideas through your innovation pipeline.'
              : `${totalActive} active across the pipeline${innovations.length - totalActive > 0 ? `, ${innovations.length - totalActive} shelved` : ''}.`
            }
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/innovations/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add innovation
        </Link>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-20 border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--bg-subtle))] flex items-center justify-center">
            <svg className="w-6 h-6 text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a14.974 14.974 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-[rgb(var(--fg))]">No innovations yet</h3>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Capture your first idea to start the pipeline.</p>
          <Link
            href={`/${tenantSlug}/innovations/new`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add innovation
          </Link>
        </div>
      )}

      {/* Pipeline columns */}
      {!isEmpty && (
        <>
          {/* Pipeline progress bar — visual stage summary */}
          <div className="flex gap-1 mb-6 h-1.5 rounded-full overflow-hidden bg-[rgb(var(--border))]">
            {STAGES.filter(s => s.key !== 'shelved').map(stage => {
              const count = grouped[stage.key]?.length ?? 0
              const pct = totalActive > 0 ? (count / totalActive) * 100 : 0
              return pct > 0 ? (
                <div
                  key={stage.key}
                  className={`h-full ${stage.dot} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${stage.label}: ${count}`}
                />
              ) : null
            })}
          </div>

          {/* Stage columns — horizontal scroll on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STAGES.map(stage => {
              const items = grouped[stage.key] ?? []
              return (
                <div key={stage.key} className="flex flex-col gap-2">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                        {stage.label}
                      </span>
                    </div>
                    {items.length > 0 && (
                      <span className="text-xs text-[rgb(var(--fg-muted))]">{items.length}</span>
                    )}
                  </div>

                  {/* Cards */}
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[rgb(var(--border))] h-16 flex items-center justify-center">
                      <span className="text-xs text-[rgb(var(--fg-muted))] opacity-50">—</span>
                    </div>
                  ) : (
                    items.map(innovation => (
                      <Link
                        key={innovation.id}
                        href={`/${tenantSlug}/innovations/${innovation.id}`}
                        className="group block bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-lg px-3 py-2.5 hover:border-[rgb(var(--color-primary,59_130_246))] transition-colors"
                      >
                        <p className="text-sm font-medium text-[rgb(var(--fg))] leading-snug group-hover:text-[rgb(var(--color-primary,59_130_246))] transition-colors line-clamp-2">
                          {innovation.title}
                        </p>
                        {innovation.data?.description && (
                          <p className="mt-1 text-xs text-[rgb(var(--fg-muted))] line-clamp-2">
                            {innovation.data.description}
                          </p>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
