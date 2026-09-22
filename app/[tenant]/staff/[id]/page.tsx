/**
 * Edit / delete staff member page.
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getServerJWTClaims } from '@/lib/supabase/server'
import { updateStaffMember, deleteStaffMember } from '../actions'
import SkillsForm from '../_components/SkillsForm'
import type { Skill } from '../_components/SkillsForm'

interface EditStaffPageProps {
  params: { tenant: string; id: string }
}

interface StaffMember {
  id: string
  name: string
  department: string | null
  role_title: string | null
  skills: Skill[]
}

async function getStaffMember(tenantSlug: string, staffId: string): Promise<StaffMember | null> {
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
    .eq('id', staffId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) return null

  return {
    ...data,
    skills: Array.isArray(data.skills) ? (data.skills as Skill[]) : [],
  }
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { tenant: tenantSlug, id: staffId } = params
  const member = await getStaffMember(tenantSlug, staffId)

  if (!member) notFound()

  const updateAction = updateStaffMember.bind(null, tenantSlug, staffId)
  const deleteAction = deleteStaffMember.bind(null, tenantSlug, staffId)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-6">
        <Link href={`/${tenantSlug}/staff`} className="hover:text-[rgb(var(--fg))] transition-colors">
          Staff Skills
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[rgb(var(--fg))] truncate max-w-[200px]">{member.name}</span>
      </nav>

      {/* Edit form */}
      <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-6">
        <h1 className="text-xl font-semibold text-[rgb(var(--fg))] mb-6">Edit team member</h1>

        <form action={updateAction} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[rgb(var(--fg))] mb-1.5">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={member.name}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
            />
          </div>

          {/* Role title */}
          <div>
            <label htmlFor="role_title" className="block text-sm font-medium text-[rgb(var(--fg))] mb-1.5">
              Role title <span className="text-[rgb(var(--fg-muted))] font-normal">(optional)</span>
            </label>
            <input
              id="role_title"
              name="role_title"
              type="text"
              defaultValue={member.role_title ?? ''}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-[rgb(var(--fg))] mb-1.5">
              Department <span className="text-[rgb(var(--fg-muted))] font-normal">(optional)</span>
            </label>
            <input
              id="department"
              name="department"
              type="text"
              defaultValue={member.department ?? ''}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
            />
          </div>

          {/* Skills — client component with existing data pre-loaded */}
          <SkillsForm initialSkills={member.skills} />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/${tenantSlug}/staff`}
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
          Permanently remove {member.name} from the team. This action cannot be undone.
        </p>
        <form action={deleteAction}>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Remove member
          </button>
        </form>
      </div>
    </div>
  )
}
