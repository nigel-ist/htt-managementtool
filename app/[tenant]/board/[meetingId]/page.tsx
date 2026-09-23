import { notFound, redirect } from 'next/navigation'
import { getBoardMeeting, updateBoardMeeting, deleteBoardMeeting } from '../actions'
import { MEETING_TYPES, TYPE_META } from '../types'
import Link from 'next/link'

export default async function BoardMeetingDetailPage({ params }: { params: { tenant: string; meetingId: string } }) {
  const { tenant, meetingId } = await Promise.resolve(params)
  const meeting = await getBoardMeeting(tenant, meetingId)
  if (!meeting) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateBoardMeeting(tenant, meetingId, formData)
    redirect(`/${tenant}/board`)
  }
  async function handleDelete() {
    'use server'
    await deleteBoardMeeting(tenant, meetingId)
    redirect(`/${tenant}/board`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/board`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Board</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Edit Meeting</h1>
      </div>
      <form action={handleUpdate} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title *</label>
            <input name="title" required defaultValue={meeting.title} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Type</label>
            <select name="meeting_type" defaultValue={meeting.meeting_type} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {MEETING_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Date *</label>
            <input name="meeting_date" type="date" required defaultValue={meeting.meeting_date} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Location</label>
            <input name="location" defaultValue={meeting.location ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Attendees (one per line)</label>
          <textarea name="attendees" rows={3} defaultValue={meeting.attendees.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Agenda</label>
          <textarea name="agenda" rows={4} defaultValue={meeting.agenda ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Minutes</label>
          <textarea name="minutes" rows={4} defaultValue={meeting.minutes ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Action Items (one per line)</label>
          <textarea name="action_items" rows={3} defaultValue={meeting.action_items.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Save Changes</button>
          <Link href={`/${tenant}/board`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
        </div>
      </form>
      <div className="mt-10 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Meeting</button>
        </form>
      </div>
    </div>
  )
}
