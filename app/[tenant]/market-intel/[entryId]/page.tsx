import { notFound } from 'next/navigation'
import { getIntelEntry, updateIntelEntry, deleteIntelEntry } from '../actions'
import { INTEL_CATEGORIES, CATEGORY_META } from '../types'
export const metadata = { title: 'Intel Entry' }
interface Props { params: { tenant: string; entryId: string } }
export default async function IntelEntryPage({ params }: Props) {
  const { tenant: slug, entryId } = params
  const entry = await getIntelEntry(slug, entryId)
  if (!entry) notFound()
  async function handleUpdate(formData: FormData) { 'use server'; await updateIntelEntry(slug, entryId, formData) }
  async function handleDelete() { 'use server'; await deleteIntelEntry(slug, entryId) }
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/${slug}/market-intel`} className="text-sm text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]">← Market Intel</a>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-sm font-medium text-[rgb(var(--text-1))] truncate">{entry.title}</span>
      </div>
      <form action={handleUpdate} className="space-y-4">
        <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title <span className="text-red-500">*</span></label>
          <input name="title" required defaultValue={entry.title} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Category</label>
            <select name="category" defaultValue={entry.category} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none">
              {INTEL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Source</label>
            <input name="source" defaultValue={entry.source ?? ''} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Date</label>
            <input name="source_date" type="date" defaultValue={entry.source_date ?? ''} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
          <textarea name="body" rows={6} defaultValue={entry.body ?? ''} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none resize-y" /></div>
        <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags</label>
          <input name="tags" defaultValue={entry.tags.join(', ')} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" /></div>
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded-lg hover:opacity-90 transition-opacity">Save changes</button>
            <a href={`/${slug}/market-intel`} className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-2))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors">Cancel</a>
          </div>
          <form action={handleDelete}><button type="submit" className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">Delete</button></form>
        </div>
      </form>
    </div>
  )
}
