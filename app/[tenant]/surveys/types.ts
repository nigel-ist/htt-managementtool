export type SurveyStatus = 'draft' | 'active' | 'closed'

export interface SurveyQuestion {
  id: string
  text: string
  type: 'text' | 'rating' | 'yesno'
}

export interface Survey {
  id: string
  title: string
  description: string | null
  status: SurveyStatus
  questions: SurveyQuestion[]
  share_token: string
  created_by: string | null
  created_at: string
  updated_at: string
  response_count?: number
}

export interface SurveyResponse {
  id: string
  survey_id: string
  respondent_name: string | null
  respondent_email: string | null
  data: Record<string, string>
  created_at: string
}

export const STATUS_META: Record<SurveyStatus, { label: string; color: string }> = {
  draft:  { label: 'Draft',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  closed: { label: 'Closed', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
}

export const SURVEY_STATUSES: SurveyStatus[] = ['draft', 'active', 'closed']
