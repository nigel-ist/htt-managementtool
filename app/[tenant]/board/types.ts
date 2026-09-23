export type MeetingType = 'board' | 'committee' | 'advisory' | 'agm'

export interface BoardMeeting {
  id: string
  title: string
  meeting_type: MeetingType
  meeting_date: string
  location: string | null
  attendees: string[]
  agenda: string | null
  minutes: string | null
  action_items: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export const TYPE_META: Record<MeetingType, { label: string; color: string }> = {
  board:     { label: 'Board',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  committee: { label: 'Committee', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  advisory:  { label: 'Advisory',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  agm:       { label: 'AGM',       color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
}

export const MEETING_TYPES: MeetingType[] = ['board', 'committee', 'advisory', 'agm']
