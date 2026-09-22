/**
 * Roles — list page.
 *
 * Groups roles by department.
 * Shows open roles with a highlighted badge.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRoles } from './actions'
import type { Role } from './types'

interface RolesPageProps {
  params: { tenant: string }
}

const LEVEL_COLORS: Record<string, string> = {
  Junior:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Mid:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Senior:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Lead:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Principal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Executive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

function RoleCard({ role, tenantSlug }: { role: Role; tenantSlug: string }) {
  return (
    <Link
      href={`/${tenantSlug}/roles/${role.id}`}
      className="group block bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl px-5 py-4 hover:border-[rgb(var(--color-primary,59_130_246))/0.5] transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[rgb(var(--fg))] group-hover:text-[rgb(var(--color-primary,59_130_246))] transition-colors">
              {role.title}
            </span>
            {role.level && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${LEVEL_COLORS[role.level] ?? 'bg-gray-100 text-gray-600'}`}>
                {role.level}
              </span>
            )}
            {role.is_open && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Open
              </span>
            )}
          </div>
          {role.responsibilities && (
            <p className="mt-1 text-xs text-[rgb(var(--fg-muted))] line-clamp-2 leading-relaxed">
              {role.responsibilities}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-[rgb(var(--fg-muted))] tabular-nums">
            {role.headcount} {role.headcount === 1 ? 'seat' : 'seats'}
          </div>
          {role.raci.length > 0 && (
            <div className="text-[10px] text-[rgb(var(--fg-muted))] mt-0.5">
              {role.raci.length} RACI
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { tenant: tenantSlug } = params
  const roles = await getRoles(tenantSlug)

  if (roles === null) notFound()

  // Group by department
  const grouped: Record<string, Role[]> = {}
  const noDept: Role[] = []
  for (const role of roles) {
    const dept = role.department ?? ''
    if (!dept) { noDept.push(role); continue }
    if (!grouped[dept]) grouped[dept] = []
    grouped[dept].push(role)
  }

  const isEmpty = roles.length === 0
  const openCount = roles.filter((r) => r.is_open).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Roles</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            {isEmpty
              ? 'Define the roles and responsibilities in your organisation.'
              : `${roles.length} role${roles.length !== 1 ? 's' : ''}${openCount > 0 ? ` · ${openCount} open` : ''}`}
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/roles/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add role
        </Link>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-20 border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--bg-subtle))] flex items-center justify-center">
            <svg className="w-6 h-6 text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-[rgb(var(--fg))]">No roles defined yet</h3>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Add role definitions, responsibilities, and RACI mappings.</p>
          <Link
            href={`/${tenantSlug}/roles/new`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add role
          </Link>
        </div>
      )}

      {/* Grouped list */}
      {!isEmpty && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dept, deptRoles]) => (
            <section key={dept}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-3">
                {dept}
              </h2>
              <div className="space-y-2">
                {deptRoles.map((role) => (
                  <RoleCard key={role.id} role={role} tenantSlug={tenantSlug} />
                ))}
              </div>
            </section>
          ))}
          {noDept.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-3">
                Other
              </h2>
              <div className="space-y-2">
                {noDept.map((role) => (
                  <RoleCard key={role.id} role={role} tenantSlug={tenantSlug} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
