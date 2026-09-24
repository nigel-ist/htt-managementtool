'use client'

import { useState } from 'react'

interface SurveyQuestion {
  id: string
  text: string
  type: 'text' | 'rating' | 'yesno'
}

interface Props {
  createAction: (formData: FormData) => Promise<void>
}

export default function NewSurveyForm({ createAction }: Props) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { id: crypto.randomUUID(), text: '', type: 'text' },
  ])

  function addQuestion() {
    setQuestions(q => [...q, { id: crypto.randomUUID(), text: '', type: 'text' }])
  }

  function removeQuestion(id: string) {
    setQuestions(q => q.filter(x => x.id !== id))
  }

  function updateQuestion(id: string, field: keyof SurveyQuestion, value: string) {
    setQuestions(q => q.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  return (
    <form action={createAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title *</label>
        <input name="title" required
          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
        <textarea name="description" rows={2}
          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Status</label>
        <select name="status" defaultValue="draft"
          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-2">Questions</label>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="flex gap-2 items-start">
              <span className="mt-2.5 text-xs text-[rgb(var(--text-3))] w-5 text-right shrink-0">{i + 1}.</span>
              <input
                name={`question_text_${i}`}
                value={q.text}
                onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                placeholder="Question text"
                className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
              />
              <select
                name={`question_type_${i}`}
                value={q.type}
                onChange={e => updateQuestion(q.id, 'type', e.target.value)}
                className="px-2 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
              >
                <option value="text">Text</option>
                <option value="rating">Rating (1–10)</option>
                <option value="yesno">Yes / No</option>
              </select>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(q.id)}
                  className="mt-2 text-[rgb(var(--text-3))] hover:text-red-500 transition-colors text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addQuestion}
          className="mt-3 w-full py-2 rounded-lg border border-dashed border-[rgb(var(--border))] text-xs text-[rgb(var(--text-3))] hover:border-[rgb(var(--accent))] transition-colors">
          + Add question
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit"
          className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          Create survey
        </button>
        <a href=".." className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">
          Cancel
        </a>
      </div>
    </form>
  )
}
