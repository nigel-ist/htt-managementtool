import { notFound, redirect } from 'next/navigation'
import { getSurvey, updateSurvey, deleteSurvey } from '../actions'
import Link from 'next/link'

export default async function SurveyDetailPage({ params }: { params: { tenant: string; surveyId: string } }) {
  const { tenant, surveyId } = await Promise.resolve(params)
  const survey = await getSurvey(tenant, surveyId)
  if (!survey) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateSurvey(tenant, surveyId, formData)
    redirect(`/${tenant}/surveys`)
  }
  async function handleDelete() {
    'use server'
    await deleteSurvey(tenant, surveyId)
    redirect(`/${tenant}/surveys`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/surveys`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Surveys</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Edit Survey</h1>
      </div>
      <form action={handleUpdate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title *</label>
          <input name="title" required defaultValue={survey.title} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={survey.description ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Status</label>
          <select name="status" defaultValue={survey.status} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Save Changes</button>
          <Link href={`/${tenant}/surveys`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
        </div>
      </form>
      <div className="mt-10 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Survey</button>
        </form>
      </div>
    </div>
  )
}
