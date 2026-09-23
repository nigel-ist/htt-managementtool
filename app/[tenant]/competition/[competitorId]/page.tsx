import { notFound, redirect } from 'next/navigation'
import { getCompetitor, updateCompetitor, deleteCompetitor } from '../actions'
import { COMPETITOR_TIERS, TIER_META } from '../types'
import Link from 'next/link'

export default async function CompetitorDetailPage({ params }: { params: { tenant: string; competitorId: string } }) {
  const { tenant, competitorId } = await Promise.resolve(params)
  const competitor = await getCompetitor(tenant, competitorId)
  if (!competitor) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateCompetitor(tenant, competitorId, formData)
    redirect(`/${tenant}/competition`)
  }

  async function handleDelete() {
    'use server'
    await deleteCompetitor(tenant, competitorId)
    redirect(`/${tenant}/competition`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/competition`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
          ← Back to Competition
        </Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Edit Competitor</h1>
      </div>

      <form action={handleUpdate} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Name *</label>
            <input name="name" required defaultValue={competitor.name} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tier</label>
            <select name="tier" defaultValue={competitor.tier} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {COMPETITOR_TIERS.map(t => <option key={t} value={t}>{TIER_META[t].label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Website</label>
          <input name="website" type="url" defaultValue={competitor.website ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Summary</label>
          <textarea name="summary" rows={3} defaultValue={competitor.summary ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Strengths (one per line)</label>
            <textarea name="strengths" rows={4} defaultValue={competitor.strengths.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">Weaknesses (one per line)</label>
            <textarea name="weaknesses" rows={4} defaultValue={competitor.weaknesses.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
          <textarea name="notes" rows={3} defaultValue={competitor.notes ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags (one per line)</label>
          <textarea name="tags" rows={2} defaultValue={competitor.tags.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Save Changes
          </button>
          <Link href={`/${tenant}/competition`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-10 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Delete Competitor
          </button>
        </form>
      </div>
    </div>
  )
}
