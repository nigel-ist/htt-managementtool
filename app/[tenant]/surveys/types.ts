export type SurveyStatus = 'draft' | 'active' | 'closed'
export type SurveyType = 'standard' | 'industry_assessment'
export type QuestionType = 'text' | 'rating' | 'yesno' | 'likert5' | 'likert6' | 'multichoice'

export interface SurveyQuestion {
  id: string
  text: string
  type: QuestionType
  /** Grouping header shown above this question in the form */
  section?: string
  /** Reverse-score this item before adding to its subscale */
  reverse_scored?: boolean
  /** For multichoice: the answer labels (e.g. ['10 cents', '5 cents', ...]) */
  options?: string[]
  /** For multichoice: the correct answer value (for scoring) */
  correct_answer?: string
}

// ── Scoring config ─────────────────────────────────────────────────────────

export interface SurveySubscale {
  /** Short key, e.g. "CE", "E", "STIM" */
  id: string
  name: string
  description?: string
  /** IDs of SurveyQuestion that contribute to this subscale */
  question_ids: string[]
  /** Raw score range BEFORE normalization */
  raw_min: number
  raw_max: number
  /** Normalize to 0–100? Default true */
  normalize?: boolean
}

export interface SurveyBand {
  /** Subscale id, or "composite" */
  subscale_id: string
  min: number
  max: number
  label: string
  description?: string
}

export interface SurveyComposite {
  name: string
  /** subscale_id → weight (should sum to 1.0) */
  weights: Record<string, number>
}

export interface SurveyScoreConfig {
  subscales: SurveySubscale[]
  /** Optional weighted composite across subscales */
  composite?: SurveyComposite
  /** Band labels by subscale (or composite) score */
  bands: SurveyBand[]
  /** question_id → correct answer string (for multichoice scoring) */
  answer_keys?: Record<string, string>
  /**
   * Higher-order groupings: e.g. Openness to Change = STIM + SELFDIR + HEDON
   * key = group name, value = subscale ids to sum
   */
  higher_order?: Record<string, string[]>
}

// ── Core models ────────────────────────────────────────────────────────────

export interface Survey {
  id: string
  title: string
  description: string | null
  status: SurveyStatus
  survey_type: SurveyType
  questions: SurveyQuestion[]
  scoring_config: SurveyScoreConfig | null
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
  /** question_id → answer string (numeric answers stored as strings) */
  data: Record<string, string>
  created_at: string
}

// ── Display metadata ───────────────────────────────────────────────────────

export const STATUS_META: Record<SurveyStatus, { label: string; color: string }> = {
  draft:  { label: 'Draft',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  closed: { label: 'Closed', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
}

export const SURVEY_STATUSES: SurveyStatus[] = ['draft', 'active', 'closed']

export const LIKERT5_LABELS = ['1', '2', '3', '4', '5']
export const LIKERT6_LABELS = ['1', '2', '3', '4', '5', '6']
