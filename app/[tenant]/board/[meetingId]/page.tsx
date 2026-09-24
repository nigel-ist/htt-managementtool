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
    redirect(`/${tenant}/board/${meetingId}`)
  }
  async function handleDelete() {
    'use server'
    await deleteBoardMeeting(tenant, meetingId)
    redirect(`/${tenant}/board`)
  }

  const meta = TYPE_META[meeting.meeting_type]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href={`/${tenant}/board`} className="text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] transition-colors">
          Board
        </Link>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-[rgb(var(--text-1))] font-medium truncate">{meeting.title}</span>
      </div>

      {/* Meeting header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] flex-1">{meeting.title}</h1>
          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-[rgb(var(--text-2))] flex-wrap">
          <span>{new Date(meeting.meeting_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {meeting.location && <span>· {meeting.location}</span>}
        </div>
      </div>

      {/* Attendees */}
      {meeting.attendees.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">
            Attendees ({meeting.attendees.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {meeting.attendees.map((a, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-1))]"
              >
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Agenda */}
      {meeting.agenda && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">Agenda</h2>
          <div className="p-4 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))]">
            {meeting.agenda.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed py-1 border-b border-[rgb(var(--border))] last:border-0">
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Minutes */}
      {meeting.minutes && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">Minutes</h2>
          <div className="p-4 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))]">
            {meeting.minutes.split('\n').map((line, i) => (
              line.trim()
                ? <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed mb-2 last:mb-0">{line}</p>
                : <div key={i} className="h-2" />
            ))}
          </div>
        </section>
      )}

      {/* Action Items */}
      {meeting.action_items.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">
            Action Items ({meeting.action_items.length})
          </h2>
          <ul className="space-y-2">
            {meeting.action_items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-[rgb(var(--surface))] border border-[rgb(var(--border))]"
              >
                <span className="mt-0.5 w-5 h-5 rounded border-2 border-[rgb(var(--border))] flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-[rgb(var(--text-1))] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Empty state */}
      {!meeting.agenda && !meeting.minutes && meeting.action_items.length === 0 && (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-[rgb(var(--border))] mb-8">
          <p className="text-sm text-[rgb(var(--text-3))]">No agenda, minutes, or action items recorded yet.</p>
          <p className="text-xs text-[rgb(var(--text-3))] mt-1">Use the form below to add meeting content.</p>
        </div>
      )}

      {/* Edit form — collapsed by default, disclosure pattern */}
      <details className="group">
        <summary className="cursor-pointer list-none flex items-center gap-2 py-3 border-t border-[rgb(var(--border))] text-sm font-medium text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] transition-colors">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Edit meeting
        </summary>

        <form action={handleUpdate} className="space-y-5 pt-5">
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
            <textarea name="agenda" rows={4} defaultValue={meeting.agenda ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-y" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Minutes</label>
            <textarea name="minutes" rows={6} defaultValue={meeting.minutes ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-y" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Action Items (one per line)</label>
            <textarea name="action_items" rows={4} defaultValue={meeting.action_items.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-y" />
          </div>
          <div className="flex gap-3 pb-2">
            <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Save Changes</button>
            <Link href={`/${tenant}/board`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
          </div>
        </form>
      </details>

      {/* Danger zone */}
      <div className="mt-8 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Delete Meeting
          </button>
        </form>
      </div>
    </div>
  )
}
