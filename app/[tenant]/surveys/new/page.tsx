import { redirect } from 'next/navigation'
import { createSurvey } from '../actions'
import Link from 'next/link'

export default async function NewSurveyPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  async function handleCreate(formData: FormData) {
    'use server'
    await createSurvey(tenant, formData)
    redirect(`/${tenant}/surveys`)
  }
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/surveys`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Surveys</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">New Survey</h1>
      </div>
      <form action={handleCreate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title *</label>
          <input name="title" required className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Status</label>
          <select name="status" defaultValue="draft" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-2">Questions (one per field)</label>
          <div className="space-y-2">
            {[0,1,2,3,4].map(i => (
              <input key={i} name={`question_${i}`} placeholder={`Question ${i + 1}`} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Create Survey</button>
          <Link href={`/${tenant}/surveys`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
