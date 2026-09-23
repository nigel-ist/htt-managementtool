import { notFound } from 'next/navigation'
import { getIdea, deleteIdea, updateIdea } from '../actions'
import { IDEA_STATUSES, STATUS_META } from '../types'

export const metadata = { title: 'Idea' }

interface Props { params: { tenant: string; ideaId: string } }

export default async function IdeaPage({ params }: Props) {
  const { tenant: slug, ideaId } = params
  const idea = await getIdea(slug, ideaId)
  if (!idea) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateIdea(slug, ideaId, formData)
  }
  async function handleDelete() {
    'use server'
    await deleteIdea(slug, ideaId)
  }

  const meta = STATUS_META[idea.status]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/${slug}/ideas`} className="text-sm text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]">← Ideas</a>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{idea.title}</span>
      </div>

      <form action={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title <span className="text-red-500">*</span></label>
          <input name="title" required defaultValue={idea.title} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
          <textarea name="description" rows={6} defaultValue={idea.description ?? ''} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] resize-y" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Status</label>
            <select name="status" defaultValue={idea.status} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none">
              {IDEA_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags</label>
            <input name="tags" defaultValue={idea.tags.join(', ')} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" placeholder="comma, separated" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded-lg hover:opacity-90 transition-opacity">Save changes</button>
            <a href={`/${slug}/ideas`} className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-2))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors">Cancel</a>
          </div>
          <form action={handleDelete}>
            <button type="submit" className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">Delete</button>
          </form>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-[rgb(var(--border))] flex items-center gap-3 text-xs text-[rgb(var(--text-3))] flex-wrap">
        <span className={`px-2 py-0.5 rounded font-semibold ${meta.color}`}>{meta.label}</span>
        <span>Created {new Date(idea.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  )
}
