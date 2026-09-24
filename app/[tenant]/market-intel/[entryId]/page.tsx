import { notFound } from 'next/navigation'
import { getIntelEntry, updateIntelEntry, deleteIntelEntry } from '../actions'
import { INTEL_CATEGORIES, CATEGORY_META } from '../types'
import Link from 'next/link'

export const metadata = { title: 'Intel Entry' }

interface Props { params: { tenant: string; entryId: string } }

export default async function IntelEntryPage({ params }: Props) {
  const { tenant: slug, entryId } = params
  const entry = await getIntelEntry(slug, entryId)
  if (!entry) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateIntelEntry(slug, entryId, formData)
  }
  async function handleDelete() {
    'use server'
    await deleteIntelEntry(slug, entryId)
  }

  const meta = CATEGORY_META[entry.category]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href={`/${slug}/market-intel`} className="text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors">
          Market Intel
        </Link>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-[rgb(var(--text-1))] font-medium truncate">{entry.title}</span>
      </div>

      {/* Read view */}
      <div className="mb-8">
        <div className="flex items-start gap-3 flex-wrap mb-3">
          <h1 className="text-xl font-semibold text-[rgb(var(--text-1))] flex-1">{entry.title}</h1>
          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-3))] mb-4 flex-wrap">
          {entry.source && <span>Source: {entry.source}</span>}
          {entry.source_date && <span>· {new Date(entry.source_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          {entry.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {entry.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-3))]">{t}</span>
              ))}
            </div>
          )}
        </div>

        {entry.body && (
          <div className="p-4 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))]">
            {entry.body.split('\n').map((line, i) => (
              line.trim()
                ? <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed mb-2 last:mb-0">{line}</p>
                : <div key={i} className="h-2" />
            ))}
          </div>
        )}
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
          Edit entry
        </summary>

        <form action={handleUpdate} className="space-y-4 pt-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={entry.title} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Category</label>
              <select name="category" defaultValue={entry.category} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none">
                {INTEL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Source</label>
              <input name="source" defaultValue={entry.source ?? ''} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Date</label>
              <input name="source_date" type="date" defaultValue={entry.source_date ?? ''} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
            <textarea name="body" rows={6} defaultValue={entry.body ?? ''} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none resize-y" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags</label>
            <input name="tags" defaultValue={entry.tags.join(', ')} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" />
          </div>
          <div className="flex gap-3 pb-2">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded-lg hover:opacity-90 transition-opacity">Save changes</button>
            <Link href={`/${slug}/market-intel`} className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-2))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors">Cancel</Link>
          </div>
        </form>
      </details>

      {/* Danger zone */}
      <div className="mt-8 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete entry</button>
        </form>
      </div>
    </div>
  )
}
