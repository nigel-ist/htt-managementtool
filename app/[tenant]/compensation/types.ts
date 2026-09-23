export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern'

export interface CompensationBand {
  id: string
  role_title: string
  level: string | null
  department: string | null
  employment_type: EmploymentType
  min_salary: number
  max_salary: number
  currency: string
  location: string | null
  notes: string | null
  effective_date: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export const EMPLOYMENT_META: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
  intern:    'Intern',
}

export const EMPLOYMENT_TYPES: EmploymentType[] = ['full_time', 'part_time', 'contract', 'intern']
