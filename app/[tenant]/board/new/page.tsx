import { redirect } from 'next/navigation'
import { createBoardMeeting } from '../actions'
import { MEETING_TYPES, TYPE_META } from '../types'
import Link from 'next/link'

export default async function NewBoardMeetingPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  async function handleCreate(formData: FormData) {
    'use server'
    await createBoardMeeting(tenant, formData)
    redirect(`/${tenant}/board`)
  }
  const today = new Date().toISOString().split('T')[0]
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/board`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Board</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">New Board Meeting</h1>
      </div>
      <form action={handleCreate} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title *</label>
            <input name="title" required className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Type</label>
            <select name="meeting_type" defaultValue="board" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {MEETING_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Date *</label>
            <input name="meeting_date" type="date" required defaultValue={today} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Location</label>
            <input name="location" placeholder="Virtual / Conference Room A" className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Attendees (one per line)</label>
          <textarea name="attendees" rows={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Agenda</label>
          <textarea name="agenda" rows={4} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Minutes</label>
          <textarea name="minutes" rows={4} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Action Items (one per line)</label>
          <textarea name="action_items" rows={3} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Create Meeting</button>
          <Link href={`/${tenant}/board`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
