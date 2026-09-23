import { redirect } from 'next/navigation'
import { createCompetitor } from '../actions'
import { COMPETITOR_TIERS, TIER_META } from '../types'
import Link from 'next/link'

export default async function NewCompetitorPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)

  async function handleCreate(formData: FormData) {
    'use server'
    await createCompetitor(tenant, formData)
    redirect(`/${tenant}/competition`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/competition`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
          ← Back to Competition
        </Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Add Competitor</h1>
      </div>

      <form action={handleCreate} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Name *</label>
            <input name="name" required className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tier</label>
            <select name="tier" defaultValue="direct" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {COMPETITOR_TIERS.map(t => <option key={t} value={t}>{TIER_META[t].label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Website</label>
          <input name="website" type="url" placeholder="https://" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Summary</label>
          <textarea name="summary" rows={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Strengths (one per line)</label>
            <textarea name="strengths" rows={4} placeholder="Fast delivery&#10;Strong brand&#10;Price point" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">Weaknesses (one per line)</label>
            <textarea name="weaknesses" rows={4} placeholder="Limited features&#10;Poor support&#10;Slow updates" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags (one per line)</label>
          <textarea name="tags" rows={2} placeholder="saas&#10;enterprise" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Add Competitor
          </button>
          <Link href={`/${tenant}/competition`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
