import { redirect } from 'next/navigation'
import { getServerJWTClaims } from '@/lib/supabase/server'
import { createIdea } from '../actions'
import { IDEA_STATUSES, STATUS_META } from '../types'

export const metadata = { title: 'New Idea' }

interface Props { params: { tenant: string } }

export default async function NewIdeaPage({ params }: Props) {
  const { tenant: slug } = params
  const claims = await getServerJWTClaims()
  if (!claims) redirect('/login')

  async function action(formData: FormData) {
    'use server'
    await createIdea(slug, formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/${slug}/ideas`} className="text-sm text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]">← Ideas</a>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-sm font-medium text-[rgb(var(--text-1))]">New idea</span>
      </div>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title <span className="text-red-500">*</span></label>
          <input name="title" required className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" placeholder="Describe the idea briefly" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
          <textarea name="description" rows={5} className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] resize-y" placeholder="What is the idea? What problem does it solve?" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Status</label>
            <select name="status" className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none">
              {IDEA_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags</label>
            <input name="tags" className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]" placeholder="comma, separated, tags" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded-lg hover:opacity-90 transition-opacity">Save idea</button>
          <a href={`/${slug}/ideas`} className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-2))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors">Cancel</a>
        </div>
      </form>
    </div>
  )
}
