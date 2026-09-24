import { notFound } from 'next/navigation'
import { getIdea, deleteIdea, updateIdea } from '../actions'
import { IDEA_STATUSES, STATUS_META } from '../types'
import Link from 'next/link'

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href={`/${slug}/ideas`} className="text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors">
          Ideas
        </Link>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-[rgb(var(--text-1))] font-medium truncate">{idea.title}</span>
      </div>

      {/* Read view */}
      <div className="mb-8">
        <div className="flex items-start gap-3 flex-wrap mb-3">
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] flex-1">{idea.title}</h1>
          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
            {meta.label}
          </span>
        </div>

        {idea.description && (
          <div className="mt-4 p-4 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))]">
            {idea.description.split('\n').map((line, i) => (
              line.trim()
                ? <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed mb-2 last:mb-0">{line}</p>
                : <div key={i} className="h-2" />
            ))}
          </div>
        )}

        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {idea.tags.map(t => (
              <span key={t} className="px-2.5 py-0.5 rounded-full text-xs bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-2))]">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-4 text-xs text-[rgb(var(--text-3))]">
          {idea.submitted_by && <span>Submitted by {idea.submitted_by}</span>}
          <span>Created {new Date(idea.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Edit section — disclosure */}
      <details className="group">
        <summary className="cursor-pointer list-none flex items-center gap-2 py-3 border-t border-[rgb(var(--border))] text-sm font-medium text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] transition-colors">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Edit idea
        </summary>

        <form action={handleUpdate} className="space-y-4 pt-5">
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
          <div className="flex gap-3 pb-2">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded-lg hover:opacity-90 transition-opacity">Save changes</button>
            <Link href={`/${slug}/ideas`} className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-2))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors">Cancel</Link>
          </div>
        </form>
      </details>

      {/* Danger zone */}
      <div className="mt-8 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete idea</button>
        </form>
      </div>
    </div>
  )
}
