import { getBoardMeetings } from './actions'
import { TYPE_META } from './types'
import Link from 'next/link'

export default async function BoardPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const meetings = await getBoardMeetings(tenant)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Board Management</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Board meetings, minutes and action items</p>
        </div>
        <Link href={`/${tenant}/board/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          + New Meeting
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No board meetings recorded yet</p>
          <p className="text-sm">Add your first meeting to track board activity.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => {
            const meta = TYPE_META[m.meeting_type]
            return (
              <Link
                key={m.id}
                href={`/${tenant}/board/${m.id}`}
                className="flex items-start gap-4 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-[rgb(var(--text-1))] truncate">{m.title}</h2>
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[rgb(var(--text-2))]">
                    <span>{new Date(m.meeting_date).toLocaleDateString()}</span>
                    {m.location && <span className="hidden sm:block">· {m.location}</span>}
                    {m.attendees.length > 0 && <span className="hidden sm:block">· {m.attendees.length} attendees</span>}
                  </div>
                  {m.action_items.length > 0 && (
                    <p className="text-xs text-[rgb(var(--text-3))] mt-1">{m.action_items.length} action item{m.action_items.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
