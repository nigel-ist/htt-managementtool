'use client'

/**
 * Roles — new role form.
 */

import { useRef, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { createRole } from '../actions'
import { LEVELS, type RaciItem } from '../types'

let raciCounter = 0
function newRaciId() { return `raci_${++raciCounter}_${Date.now()}` }

function RaciRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: RaciItem & { _id: string }
  onUpdate: (updated: RaciItem & { _id: string }) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 items-center">
      <input
        type="text"
        placeholder="Activity or decision…"
        value={item.activity}
        onChange={(e) => onUpdate({ ...item, activity: e.target.value })}
        className="text-xs px-2.5 py-1.5 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary,59_130_246))]"
      />
      {(['r', 'a', 'c', 'i'] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onUpdate({ ...item, [key]: !item[key] })}
          title={{ r: 'Responsible', a: 'Accountable', c: 'Consulted', i: 'Informed' }[key]}
          className={[
            'w-7 h-7 rounded text-xs font-bold uppercase transition-colors',
            item[key]
              ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white'
              : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] border border-[rgb(var(--border))] hover:border-[rgb(var(--color-primary,59_130_246))/0.4]',
          ].join(' ')}
        >
          {key.toUpperCase()}
        </button>
      ))}
      <button
        type="button"
        onClick={onRemove}
        className="text-[rgb(var(--fg-muted))] hover:text-red-500 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function NewRolePage() {
  const params = useParams<{ tenant: string }>()
  const tenantSlug = params.tenant

  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [headcount, setHeadcount] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [raci, setRaci] = useState<Array<RaciItem & { _id: string }>>([])
  const [isPending, startTransition] = useTransition()

  function addRaciRow() {
    setRaci((prev) => [...prev, { _id: newRaciId(), activity: '', r: false, a: false, c: false, i: false }])
  }

  function updateRaciRow(idx: number, updated: RaciItem & { _id: string }) {
    setRaci((prev) => prev.map((row, i) => (i === idx ? updated : row)))
  }

  function removeRaciRow(idx: number) {
    setRaci((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim() || isPending) return

    const fd = new FormData()
    fd.set('title', title)
    fd.set('department', department)
    fd.set('level', level)
    fd.set('responsibilities', responsibilities)
    fd.set('headcount', String(headcount))
    fd.set('is_open', String(isOpen))
    fd.set('raci_json', JSON.stringify(
      raci.filter((r) => r.activity.trim()).map(({ _id, ...rest }) => rest)
    ))

    startTransition(() => createRole(tenantSlug, fd))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-4">
          <a href={`/${tenantSlug}/roles`} className="hover:text-[rgb(var(--fg))] transition-colors">Roles</a>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[rgb(var(--fg))]">New Role</span>
        </nav>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">New Role</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">
            Role Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Product Manager"
            required
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4]"
          />
        </div>

        {/* Dept + Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering"
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">
              Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4]"
            >
              <option value="">Select level…</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Headcount + Open */}
        <div className="flex items-center gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">
              Headcount
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={headcount}
              onChange={(e) => setHeadcount(parseInt(e.target.value, 10) || 1)}
              className="w-24 text-sm px-3 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] tabular-nums"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <button
              type="button"
              role="switch"
              aria-checked={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className={[
                'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                isOpen ? 'bg-emerald-500' : 'bg-[rgb(var(--border))]',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  isOpen ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
            <span className="text-sm text-[rgb(var(--fg))]">Open position</span>
          </div>
        </div>

        {/* Responsibilities */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">
            Responsibilities
          </label>
          <textarea
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            placeholder="Describe the key responsibilities of this role…"
            rows={4}
            className="w-full text-sm px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4]"
          />
        </div>

        {/* RACI */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))]">
              RACI Mappings
            </label>
            <div className="flex gap-3 text-[10px] text-[rgb(var(--fg-muted))] font-mono">
              <span>R = Responsible</span>
              <span>A = Accountable</span>
              <span>C = Consulted</span>
              <span>I = Informed</span>
            </div>
          </div>
          {raci.length > 0 && (
            <div className="space-y-2 mb-2">
              {raci.map((row, idx) => (
                <RaciRow
                  key={row._id}
                  item={row}
                  onUpdate={(updated) => updateRaciRow(idx, updated)}
                  onRemove={() => removeRaciRow(idx)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addRaciRow}
            className="w-full py-2 rounded-lg border border-dashed border-[rgb(var(--border))] text-xs text-[rgb(var(--fg-muted))] hover:border-[rgb(var(--color-primary,59_130_246))/0.4] hover:text-[rgb(var(--fg))] transition-colors"
          >
            + Add RACI row
          </button>
        </div>

        {/* Actions */}
        <div className="pt-2 pb-8 flex items-center justify-between">
          <a
            href={`/${tenantSlug}/roles`}
            className="text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
          >
            ← Cancel
          </a>
          <button
            type="submit"
            disabled={!title.trim() || isPending}
            className={[
              'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              title.trim() && !isPending
                ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white hover:opacity-90'
                : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] cursor-not-allowed',
            ].join(' ')}
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : 'Create role'}
          </button>
        </div>
      </form>
    </div>
  )
}
