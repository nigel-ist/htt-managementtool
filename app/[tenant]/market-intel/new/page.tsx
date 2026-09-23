import { createIntelEntry } from '../actions'
import { INTEL_CATEGORIES, CATEGORY_META } from '../types'
export const metadata = { title: 'New Intel Entry' }
interface Props { params: { tenant: string } }
export default async function NewIntelPage({ params }: Props) {
  const { tenant: slug } = params
  async function action(formData: FormData) { 'use server'; await createIntelEntry(slug, formData) }
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/${slug}/market-intel`} className="text-sm text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]">← Market Intel</a>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-sm font-medium text-[rgb(var(--text-1))]">New entry</span>
      </div>
      <form action={action} className="space-y-4">
        <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title <span className="text-red-500">*</span></label>
          <input name="title" required className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Category</label>
            <select name="category" className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none">
              {INTEL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Source</label>
            <input name="source" className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" placeholder="Publication, URL..." /></div>
          <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Date</label>
            <input name="source_date" type="date" className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
          <textarea name="body" rows={6} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none resize-y" placeholder="Key insights and implications..." /></div>
        <div><label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags</label>
          <input name="tags" className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none" placeholder="comma, separated" /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded-lg hover:opacity-90 transition-opacity">Save entry</button>
          <a href={`/${slug}/market-intel`} className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-2))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors">Cancel</a>
        </div>
      </form>
    </div>
  )
}
