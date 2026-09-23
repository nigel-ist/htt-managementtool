export type DownloadCategory = 'report' | 'template' | 'policy' | 'presentation' | 'data' | 'other'

export interface Download {
  id: string
  title: string
  description: string | null
  category: DownloadCategory
  file_url: string
  file_name: string
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export const CATEGORY_META: Record<DownloadCategory, { label: string; color: string }> = {
  report:       { label: 'Report',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  template:     { label: 'Template',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  policy:       { label: 'Policy',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  presentation: { label: 'Presentation', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  data:         { label: 'Data',         color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  other:        { label: 'Other',        color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const DOWNLOAD_CATEGORIES: DownloadCategory[] = ['report', 'template', 'policy', 'presentation', 'data', 'other']
