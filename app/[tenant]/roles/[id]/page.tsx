'use client'

/**
 * Role — detail / edit page.
 *
 * Displays the role and allows inline editing.
 * RACI table is shown in both view and edit modes.
 */

import { useEffect, useState, useTransition } from 'react'
import { useParams, notFound } from 'next/navigation'
import { getRole, updateRole, deleteRole, LEVELS, type Role, type RaciItem } from '../actions'

let raciCounter = 0
function newRaciId() { return `raci_${++raciCounter}_${Date.now()}` }

const LEVEL_COLORS: Record<string, string> = {
  Junior:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Mid:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Senior:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Lead:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Principal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Executive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

function RaciTable({ items }: { items: RaciItem[] }) {
  if (items.length === 0) return null
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b border-[rgb(var(--border))]">
          <th className="py-2 text-left text-[rgb(var(--fg-muted))] font-semibold">Activity</th>
          {(['R', 'A', 'C', 'I'] as const).map((k) => (
            <th key={k} className="py-2 px-3 text-center text-[rgb(var(--fg-muted))] font-semibold w-10">{k}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx} className="border-b border-[rgb(var(--border))] last:border-0">
            <td className="py-2 pr-4 text-[rgb(var(--fg))]">{item.activity}</td>
            {(['r', 'a', 'c', 'i'] as const).map((key) => (
              <td key={key} className="py-2 px-3 text-center">
                {item[key]
                  ? <span className="inline-block w-5 h-5 rounded bg-[rgb(var(--color-primary,59_130_246))] text-white text-[10px] font-bold leading-5 text-center">{key.toUpperCase()}</span>
                  : <span className="text-[rgb(var(--border))]">—</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RaciEditorRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: RaciItem & { _id: string }
  onUpdate: (v: RaciItem & { _id: string }) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 items-center">
      <input
        type="text"
        value={item.activity}
        onChange={(e) => onUpdate({ ...item, activity: e.target.value })}
        placeholder="Activity…"
        className="text-xs px-2.5 py-1.5 rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none"
      />
      {(['r', 'a', 'c', 'i'] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onUpdate({ ...item, [key]: !item[key] })}
          className={[
            'w-7 h-7 rounded text-xs font-bold uppercase transition-colors',
            item[key]
              ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white'
              : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] border border-[rgb(var(--border))]',
          ].join(' ')}
        >
          {key.toUpperCase()}
        </button>
      ))}
      <button type="button" onClick={onRemove} className="text-[rgb(var(--fg-muted))] hover:text-red-500 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function RoleDetailPage() {
  const params = useParams<{ tenant: string; id: string }>()
  const { tenant: tenantSlug, id: roleId } = params

  const [role, setRole] = useState<Role | null | undefined>(undefined)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  // Edit state
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [headcount, setHeadcount] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [raciRows, setRaciRows] = useState<Array<RaciItem & { _id: string }>>([])

  useEffect(() => {
    getRole(tenantSlug, roleId).then((data) => {
      setRole(data)
      if (data) {
        setTitle(data.title)
        setDepartment(data.department ?? '')
        setLevel(data.level ?? '')
        setResponsibilities(data.responsibilities ?? '')
        setHeadcount(data.headcount)
        setIsOpen(data.is_open)
        setRaciRows(data.raci.map((r) => ({ ...r, _id: newRaciId() })))
      }
    })
  }, [tenantSlug, roleId])

  function handleSave() {
    if (!title.trim() || isPending) return
    const fd = new FormData()
    fd.set('title', title)
    fd.set('department', department)
    fd.set('level', level)
    fd.set('responsibilities', responsibilities)
    fd.set('headcount', String(headcount))
    fd.set('is_open', String(isOpen))
    fd.set('raci_json', JSON.stringify(raciRows.filter((r) => r.activity.trim()).map(({ _id, ...rest }) => rest)))
    startTransition(() => updateRole(tenantSlug, roleId, fd))
  }

  function handleDelete() {
    if (!confirm('Delete this role? This cannot be undone.')) return
    startDeleting(() => deleteRole(tenantSlug, roleId))
  }

  if (role === undefined) {
    return <div className="py-12 text-center text-sm text-[rgb(var(--fg-muted))]">Loading…</div>
  }
  if (role === null) {
    return <div className="py-12 text-center text-sm text-[rgb(var(--fg-muted))]">Role not found.</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))] mb-6">
        <a href={`/${tenantSlug}/roles`} className="hover:text-[rgb(var(--fg))] transition-colors">Roles</a>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[rgb(var(--fg))] truncate">{role.title}</span>
      </nav>

      {/* View mode */}
      {!editing && (
        <div>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">{role.title}</h1>
                {role.level && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${LEVEL_COLORS[role.level] ?? ''}`}>{role.level}</span>
                )}
                {role.is_open && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Open</span>
                )}
              </div>
              {role.department && (
                <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">{role.department} · {role.headcount} {role.headcount === 1 ? 'seat' : 'seats'}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>

          {role.responsibilities && (
            <section className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">Responsibilities</h2>
              <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-4">
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap">{role.responsibilities}</p>
              </div>
            </section>
          )}

          {role.raci.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">RACI Mappings</h2>
              <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-4">
                <RaciTable items={role.raci} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))] mb-6">Edit Role</h1>
          <div className="space-y-5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Role title"
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4]"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department"
                className="text-sm px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] focus:outline-none"
              />
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="text-sm px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] focus:outline-none"
              >
                <option value="">Select level…</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-[rgb(var(--fg-muted))]">Headcount:</label>
                <input
                  type="number" min={1} value={headcount}
                  onChange={(e) => setHeadcount(parseInt(e.target.value, 10) || 1)}
                  className="w-20 text-sm px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] focus:outline-none tabular-nums"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen((v) => !v)}
                  className={['relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', isOpen ? 'bg-emerald-500' : 'bg-[rgb(var(--border))]'].join(' ')}
                >
                  <span className={['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', isOpen ? 'translate-x-4' : 'translate-x-0'].join(' ')} />
                </button>
                <span className="text-sm text-[rgb(var(--fg))]">Open position</span>
              </div>
            </div>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="Key responsibilities…"
              rows={4}
              className="w-full text-sm px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] text-[rgb(var(--fg))] resize-none focus:outline-none"
            />

            {/* RACI editor */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--fg-muted))] mb-2">RACI</div>
              <div className="space-y-2 mb-2">
                {raciRows.map((row, idx) => (
                  <RaciEditorRow
                    key={row._id}
                    item={row}
                    onUpdate={(u) => setRaciRows((prev) => prev.map((r, i) => i === idx ? u : r))}
                    onRemove={() => setRaciRows((prev) => prev.filter((_, i) => i !== idx))}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRaciRows((prev) => [...prev, { _id: newRaciId(), activity: '', r: false, a: false, c: false, i: false }])}
                className="w-full py-2 rounded-lg border border-dashed border-[rgb(var(--border))] text-xs text-[rgb(var(--fg-muted))] hover:border-[rgb(var(--color-primary,59_130_246))/0.4] transition-colors"
              >
                + Add RACI row
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
              >
                ← Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!title.trim() || isPending}
                className={['inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all', title.trim() && !isPending ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white hover:opacity-90' : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] cursor-not-allowed'].join(' ')}
              >
                {isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
