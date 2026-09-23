import { redirect } from 'next/navigation'
import { createCompensationBand } from '../actions'
import { EMPLOYMENT_TYPES, EMPLOYMENT_META } from '../types'
import Link from 'next/link'

export default async function NewCompensationPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  async function handleCreate(formData: FormData) {
    'use server'
    await createCompensationBand(tenant, formData)
    redirect(`/${tenant}/compensation`)
  }
  const today = new Date().toISOString().split('T')[0]
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/compensation`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Compensation</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Add Compensation Band</h1>
      </div>
      <form action={handleCreate} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Role Title *</label>
            <input name="role_title" required className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Level</label>
            <input name="level" placeholder="e.g. Senior, L3" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Department</label>
            <input name="department" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Employment Type</label>
            <select name="employment_type" defaultValue="full_time" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{EMPLOYMENT_META[t]}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Min Salary *</label>
            <input name="min_salary" type="number" min="0" required className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Max Salary *</label>
            <input name="max_salary" type="number" min="0" required className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Currency</label>
            <input name="currency" defaultValue="USD" maxLength={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Location</label>
            <input name="location" placeholder="Remote, NYC, etc." className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Effective Date *</label>
            <input name="effective_date" type="date" required defaultValue={today} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Add Band</button>
          <Link href={`/${tenant}/compensation`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
