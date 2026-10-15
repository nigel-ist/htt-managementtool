'use client'

import { useState, useRef } from 'react'

interface ImportResponsesPanelProps {
  surveyId: string
  tenantSlug: string
}

type ImportMode = 'csv' | 'doc' | null

export default function ImportResponsesPanel({ surveyId, tenantSlug }: ImportResponsesPanelProps) {
  const [mode, setMode] = useState<ImportMode>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleCsvImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    setMessage(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('surveyId', surveyId)
    fd.append('tenantSlug', tenantSlug)
    try {
      const res = await fetch('/api/surveys/import-csv', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.error) setMessage(`Error: ${json.error}`)
      else setMessage(`Imported ${json.inserted} response${json.inserted !== 1 ? 's' : ''}`)
    } catch {
      setMessage('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleDocParse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    setMessage(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('surveyId', surveyId)
    fd.append('tenantSlug', tenantSlug)
    try {
      const res = await fetch('/api/surveys/parse-doc', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.error) setMessage(`Error: ${json.error}`)
      else setMessage(`Parsed ${json.questionCount} questions. Review in survey editor.`)
    } catch {
      setMessage('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  if (mode === null) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('csv')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs font-medium text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Import CSV
        </button>
        <button
          onClick={() => setMode('doc')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs font-medium text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Parse doc
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <form
        onSubmit={mode === 'csv' ? handleCsvImport : handleDocParse}
        className="flex items-center gap-2"
      >
        <input
          ref={fileRef}
          type="file"
          accept={mode === 'csv' ? '.csv' : '.pdf,.docx,.txt,.doc'}
          className="text-xs text-[rgb(var(--fg-muted))] file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-[rgb(var(--border))] file:text-xs file:bg-[rgb(var(--bg-card))] file:text-[rgb(var(--fg))] hover:file:bg-[rgb(var(--bg-subtle))]"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-2.5 py-1.5 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? '…' : mode === 'csv' ? 'Import' : 'Parse'}
        </button>
        <button
          type="button"
          onClick={() => { setMode(null); setMessage(null) }}
          className="px-2 py-1.5 rounded-lg text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
        >
          Cancel
        </button>
      </form>
      {message && (
        <span className={`text-xs ${message.startsWith('Error') || message.startsWith('Upload') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {message}
        </span>
      )}
    </div>
  )
}
