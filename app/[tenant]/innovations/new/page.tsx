/**
 * New innovation form.
 */
import Link from 'next/link'
import { createInnovation } from '../actions'

interface NewInnovationPageProps {
  params: { tenant: string }
}

const STAGES = [
  { value: 'idea',    label: 'Idea',    description: 'Initial concept, not yet validated' },
  { value: 'explore', label: 'Explore', description: 'Researching feasibility and market fit' },
  { value: 'develop', label: 'Develop', description: 'Actively building or prototyping' },
  { value: 'pilot',   label: 'Pilot',   description: 'Testing with a small group or market' },
  { value: 'scale',   label: 'Scale',   description: 'Proven and growing' },
  { value: 'shelved', label: 'Shelved', description: 'Paused or deprioritised' },
]

export default function NewInnovationPage({ params }: NewInnovationPageProps) {
  const { tenant: tenantSlug } = params
  const action = createInnovation.bind(null, tenantSlug)

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
        <span className="text-[rgb(var(--fg))]">New innovation</span>
      </nav>

      <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
        <h1 className="text-xl font-semibold text-[rgb(var(--fg))] mb-6">Add an innovation</h1>

        <form action={action} className="space-y-5">
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
              placeholder="e.g. AI-powered onboarding assistant"
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
              defaultValue="idea"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
            >
              {STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label} — {s.description}</option>
              ))}
            </select>
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
              placeholder="What problem does this solve? What's the opportunity?"
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
              Create innovation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
