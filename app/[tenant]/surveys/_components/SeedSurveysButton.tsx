'use client'

import { useState } from 'react'
import { seedStandardSurveys } from '@/app/[tenant]/surveys/actions'

interface SeedSurveysButtonProps {
  tenantSlug: string
}

export default function SeedSurveysButton({ tenantSlug }: SeedSurveysButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSeed() {
    setLoading(true)
    setResult(null)
    try {
      const res = await seedStandardSurveys(tenantSlug)
      if (res.error) {
        setResult(`Error: ${res.error}`)
      } else if (res.seeded.length === 0 && res.skipped.length > 0) {
        setResult('Already loaded')
      } else {
        const parts: string[] = []
        if (res.seeded.length > 0) parts.push(`Loaded: ${res.seeded.join(', ')}`)
        if (res.skipped.length > 0) parts.push(`Already present: ${res.skipped.join(', ')}`)
        setResult(parts.join(' · '))
      }
    } catch (err) {
      setResult('Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-sm font-medium text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-subtle))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-[rgb(var(--fg-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Load standard assessments
          </>
        )}
      </button>
      {result && (
        <span className={`text-xs ${result.startsWith('Error') || result.startsWith('Failed') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {result}
        </span>
      )}
    </div>
  )
}
