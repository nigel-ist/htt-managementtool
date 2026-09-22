/**
 * Roles module — shared types and constants.
 * No 'use server' directive — safe to import in both server and client code.
 */

// ─── Types ────────────────────────────────────────────────────────

export interface RaciItem {
  activity: string
  r?: boolean   // Responsible
  a?: boolean   // Accountable
  c?: boolean   // Consulted
  i?: boolean   // Informed
}

export interface Role {
  id: string
  title: string
  department: string | null
  level: string | null
  responsibilities: string | null
  raci: RaciItem[]
  headcount: number
  is_open: boolean
  created_at: string
}

export const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal', 'Executive']
