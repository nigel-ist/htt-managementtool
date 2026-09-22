'use client'

/**
 * SkillsForm — reusable client component for the dynamic skills list.
 *
 * Renders a list of skill rows (name + level + category) that the user
 * can add to or remove from. On submit the current skills array is
 * serialised to JSON in a hidden field called "skills_json", which the
 * Server Action reads via formData.get('skills_json').
 */
import { useState, useRef } from 'react'

export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category: string
}

const LEVELS: { value: Skill['level']; label: string }[] = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
  { value: 'expert',       label: 'Expert' },
]

const LEVEL_COLORS: Record<Skill['level'], string> = {
  beginner:     'text-gray-500',
  intermediate: 'text-blue-600 dark:text-blue-400',
  advanced:     'text-violet-600 dark:text-violet-400',
  expert:       'text-amber-600 dark:text-amber-400',
}

interface SkillsFormProps {
  initialSkills?: Skill[]
}

export default function SkillsForm({ initialSkills = [] }: SkillsFormProps) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const categoryRef = useRef<HTMLInputElement>(null)

  function addSkill() {
    setSkills(prev => [...prev, { name: '', level: 'intermediate', category: '' }])
  }

  function removeSkill(index: number) {
    setSkills(prev => prev.filter((_, i) => i !== index))
  }

  function updateSkill(index: number, field: keyof Skill, value: string) {
    setSkills(prev =>
      prev.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      )
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-[rgb(var(--fg))]">
          Skills
        </label>
        <button
          type="button"
          onClick={addSkill}
          className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--color-primary,59_130_246))] hover:opacity-80 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add skill
        </button>
      </div>

      {/* Hidden field serialises the skills array for the Server Action */}
      <input type="hidden" name="skills_json" value={JSON.stringify(skills)} />

      {skills.length === 0 ? (
        <div
          className="flex items-center justify-center h-16 rounded-lg border border-dashed border-[rgb(var(--border))] cursor-pointer hover:border-[rgb(var(--color-primary,59_130_246))] transition-colors"
          onClick={addSkill}
        >
          <span className="text-xs text-[rgb(var(--fg-muted))]">Click to add a skill</span>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* Skill name */}
              <input
                type="text"
                value={skill.name}
                onChange={e => updateSkill(i, 'name', e.target.value)}
                placeholder="Skill name"
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
              />

              {/* Level */}
              <select
                value={skill.level}
                onChange={e => updateSkill(i, 'level', e.target.value as Skill['level'])}
                className={`w-32 px-2 py-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition ${LEVEL_COLORS[skill.level]}`}
              >
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>

              {/* Category */}
              <input
                type="text"
                value={skill.category}
                onChange={e => updateSkill(i, 'category', e.target.value)}
                placeholder="Category"
                ref={i === skills.length - 1 ? categoryRef : undefined}
                className="w-32 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary,59_130_246))/0.4] transition"
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeSkill(i)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[rgb(var(--fg-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                aria-label="Remove skill"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSkill}
            className="mt-1 text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors underline underline-offset-2"
          >
            + Add another skill
          </button>
        </div>
      )}
    </div>
  )
}
