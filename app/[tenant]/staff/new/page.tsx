/**
 * New staff member form.
 */
import Link from 'next/link'
import { createStaffMember } from '../actions'
import SkillsForm from '../_components/SkillsForm'

interface NewStaffPageProps {
  params: { tenant: string }
}

export default function NewStaffPage({ params }: NewStaffPageProps) {
  const { tenant: tenantSlug } = params
  const action = createStaffMember.bind(null, tenantSlug)

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
        <span className="text-[rgb(var(--fg))]">New member</span>
      </nav>

      <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
        <h1 className="text-xl font-semibold text-[rgb(var(--fg))] mb-6">Add a team member</h1>

        <form action={action} className="space-y-5">
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
              placeholder="e.g. Sarah Chen"
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
              placeholder="e.g. Senior Innovation Lead"
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
              placeholder="e.g. Product, Engineering, Operations"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
            />
          </div>

          {/* Skills — client component */}
          <SkillsForm />

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
              Add member
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
