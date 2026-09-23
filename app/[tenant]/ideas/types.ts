export type IdeaStatus = 'draft' | 'proposed' | 'in_review' | 'approved' | 'rejected'

export interface Idea {
  id: string
  title: string
  description: string | null
  status: IdeaStatus
  tags: string[]
  submitted_by: string | null
  submitter_email?: string
  created_at: string
  updated_at: string
}

export const STATUS_META: Record<IdeaStatus, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  proposed:  { label: 'Proposed',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_review: { label: 'In Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  approved:  { label: 'Approved',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

export const IDEA_STATUSES: IdeaStatus[] = ['draft', 'proposed', 'in_review', 'approved', 'rejected']
