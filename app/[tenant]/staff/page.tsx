/**
 * Staff Skills list page — grouped by department.
 *
 * Each person shows their role title and a row of skill badges
 * colour-coded by level (beginner → intermediate → advanced → expert).
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'

interface StaffPageProps {
  params: { tenant: string }
}

interface StaffMember {
  id: string
  name: string
  department: string | null
  role_title: string | null
  skills: { name: string; level: string; category: string }[]
}

const LEVEL_STYLES: Record<string, string> = {
  beginner:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  advanced:     'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  expert:       'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

const LEVEL_DOT: Record<string, string> = {
  beginner:     'bg-gray-400',
  intermediate: 'bg-blue-400',
  advanced:     'bg-violet-500',
  expert:       'bg-amber-400',
}

async function getStaff(tenantSlug: string): Promise<StaffMember[] | null> {
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
    .from('staff_skills')
    .select('id, name, department, role_title, skills')
    .eq('tenant_id', tenantId)
    .order('department', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('[staff/page] query error:', error)
    return null
  }

  return (data ?? []).map(row => ({
    ...row,
    skills: Array.isArray(row.skills) ? row.skills : [],
  }))
}

export default async function StaffPage({ params }: StaffPageProps) {
  const { tenant: tenantSlug } = params
  const staff = await getStaff(tenantSlug)

  if (staff === null) notFound()

  // Group by department (null → "No department")
  const grouped = staff.reduce<Record<string, StaffMember[]>>((acc, member) => {
    const dept = member.department || 'No department'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(member)
    return acc
  }, {})

  const departments = Object.keys(grouped).sort((a, b) => {
    if (a === 'No department') return 1
    if (b === 'No department') return -1
    return a.localeCompare(b)
  })

  const isEmpty = staff.length === 0

  // Skill level legend
  const levels = ['beginner', 'intermediate', 'advanced', 'expert']

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Staff Skills</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            {isEmpty
              ? 'Map your team\'s capabilities across departments.'
              : `${staff.length} team member${staff.length !== 1 ? 's' : ''} across ${departments.filter(d => d !== 'No department').length || departments.length} department${departments.length !== 1 ? 's' : ''}.`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          {!isEmpty && (
            <div className="hidden sm:flex items-center gap-3">
              {levels.map(level => (
                <div key={level} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${LEVEL_DOT[level]}`} />
                  <span className="text-xs text-[rgb(var(--fg-muted))] capitalize">{level}</span>
                </div>
              ))}
            </div>
          )}
          <Link
            href={`/${tenantSlug}/staff/new`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add member
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-20 border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--bg-subtle))] flex items-center justify-center">
            <svg className="w-6 h-6 text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-[rgb(var(--fg))]">No team members yet</h3>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Add your first team member to map your capabilities.</p>
          <Link
            href={`/${tenantSlug}/staff/new`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add member
          </Link>
        </div>
      )}

      {/* Department groups */}
      {!isEmpty && (
        <div className="space-y-8">
          {departments.map(dept => (
            <section key={dept}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--fg-muted))] mb-3 flex items-center gap-2">
                {dept}
                <span className="font-medium px-1.5 py-0.5 rounded bg-[rgb(var(--bg-subtle))]">
                  {grouped[dept].length}
                </span>
              </h2>

              <div className="border border-[rgb(var(--border))] rounded-xl overflow-hidden divide-y divide-[rgb(var(--border))]">
                {grouped[dept].map(member => (
                  <div
                    key={member.id}
                    className="flex items-start gap-4 px-4 py-3 bg-[rgb(var(--bg-card))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                  >
                    {/* Avatar initial */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgb(var(--color-primary,59_130_246))]/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-[rgb(var(--color-primary,59_130_246))]">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[rgb(var(--fg))]">{member.name}</span>
                        {member.role_title && (
                          <span className="text-xs text-[rgb(var(--fg-muted))]">{member.role_title}</span>
                        )}
                      </div>

                      {/* Skills */}
                      {member.skills.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {member.skills.map((skill, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_STYLES[skill.level] ?? LEVEL_STYLES.beginner}`}
                              title={`${skill.level}${skill.category ? ` · ${skill.category}` : ''}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_DOT[skill.level] ?? LEVEL_DOT.beginner}`} />
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-[rgb(var(--fg-muted))] italic">No skills recorded</p>
                      )}
                    </div>

                    <Link
                      href={`/${tenantSlug}/staff/${member.id}`}
                      className="flex-shrink-0 text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] underline underline-offset-2 transition-colors mt-0.5"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
