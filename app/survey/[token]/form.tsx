'use client'

import { useState } from 'react'
import type { Survey } from '@/app/[tenant]/surveys/types'

interface Props {
  survey: Survey
  token: string
}

export default function SurveyResponseForm({ survey, token }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = survey.questions.every(q => (answers[q.id] ?? '').trim() !== '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/surveys/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name || undefined, email: email || undefined, answers }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Submission failed. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-8 rounded-2xl border border-[rgb(var(--border,220_220_228))] bg-white dark:bg-[rgb(var(--surface,30_30_40))] text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[rgb(var(--text-1,15_15_20))]">Response submitted</h2>
        <p className="mt-1 text-sm text-[rgb(var(--text-2,100_100_115))]">Thank you for completing this survey.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Optional identity */}
      <div className="p-5 rounded-2xl border border-[rgb(var(--border,220_220_228))] bg-white dark:bg-[rgb(var(--surface,30_30_40))] space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3,160_160_175))]">Your details (optional)</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border,220_220_228))] bg-transparent text-sm text-[rgb(var(--text-1,15_15_20))] placeholder:text-[rgb(var(--text-3,160_160_175))] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border,220_220_228))] bg-transparent text-sm text-[rgb(var(--text-1,15_15_20))] placeholder:text-[rgb(var(--text-3,160_160_175))] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Questions */}
      {survey.questions.map((q, idx) => (
        <div key={q.id} className="p-5 rounded-2xl border border-[rgb(var(--border,220_220_228))] bg-white dark:bg-[rgb(var(--surface,30_30_40))]">
          <label className="block text-sm font-medium text-[rgb(var(--text-1,15_15_20))] mb-3">
            <span className="text-xs text-[rgb(var(--text-3,160_160_175))] mr-2">{idx + 1}.</span>
            {q.text}
          </label>

          {q.type === 'yesno' ? (
            <div className="flex gap-3">
              {['Yes', 'No'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                  className={[
                    'px-5 py-2 rounded-lg text-sm font-medium border transition-colors',
                    answers[q.id] === opt
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-[rgb(var(--border,220_220_228))] text-[rgb(var(--text-1,15_15_20))] hover:border-blue-400',
                  ].join(' ')}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : q.type === 'rating' ? (
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: String(n) }))}
                  className={[
                    'w-9 h-9 rounded-lg text-sm font-medium border transition-colors',
                    answers[q.id] === String(n)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-[rgb(var(--border,220_220_228))] text-[rgb(var(--text-1,15_15_20))] hover:border-blue-400',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              rows={3}
              value={answers[q.id] ?? ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Your answer…"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border,220_220_228))] bg-transparent text-sm text-[rgb(var(--text-1,15_15_20))] placeholder:text-[rgb(var(--text-3,160_160_175))] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!allAnswered || submitting}
        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit response'}
      </button>
    </form>
  )
}
