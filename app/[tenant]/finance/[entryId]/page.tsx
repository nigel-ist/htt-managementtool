import { notFound, redirect } from 'next/navigation'
import { getFinanceEntry, updateFinanceEntry, deleteFinanceEntry } from '../actions'
import { FINANCE_CATEGORIES, FINANCE_PERIODS, CATEGORY_META, PERIOD_META } from '../types'
import Link from 'next/link'

export default async function FinanceEntryPage({ params }: { params: { tenant: string; entryId: string } }) {
  const { tenant, entryId } = await Promise.resolve(params)
  const entry = await getFinanceEntry(tenant, entryId)
  if (!entry) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateFinanceEntry(tenant, entryId, formData)
    redirect(`/${tenant}/finance`)
  }
  async function handleDelete() {
    'use server'
    await deleteFinanceEntry(tenant, entryId)
    redirect(`/${tenant}/finance`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/finance`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Finance</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Edit Entry</h1>
      </div>
      <form action={handleUpdate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title *</label>
          <input name="title" required defaultValue={entry.title} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Category</label>
            <select name="category" defaultValue={entry.category} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {FINANCE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Period</label>
            <select name="period" defaultValue={entry.period} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {FINANCE_PERIODS.map(p => <option key={p} value={p}>{PERIOD_META[p]}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Amount *</label>
            <input name="amount" type="number" step="0.01" min="0" required defaultValue={entry.amount} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Currency</label>
            <input name="currency" defaultValue={entry.currency} maxLength={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Date *</label>
          <input name="entry_date" type="date" required defaultValue={entry.entry_date} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={entry.description ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags (one per line)</label>
          <textarea name="tags" rows={2} defaultValue={entry.tags.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Save Changes</button>
          <Link href={`/${tenant}/finance`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
        </div>
      </form>
      <div className="mt-10 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Entry</button>
        </form>
      </div>
    </div>
  )
}
