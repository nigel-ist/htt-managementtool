/**
 * Database types for the TIL Platform.
 *
 * These are hand-written for Phase 1. Once you have a running Supabase
 * project, regenerate with:
 *   npm run db:types
 * which runs: supabase gen types typescript --local > lib/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type TenantTier = 'standard' | 'professional' | 'enterprise'
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type ILRole = 'super_admin' | 'admin' | 'support'
export type ProductType = 'current' | 'proposed' | 'launch' | 'strategic_growth' | 'shelved'
export type InnovationStage = 'idea' | 'explore' | 'develop' | 'pilot' | 'scale' | 'shelved'
export type HTTSource = 'diagnostic' | 'seminar' | 'coach_inferred'
export type HTTPromptType = 'orienting' | 'embedded' | 'coach' | 'diagnostic'

export type HTTCapabilityKey =
  | 'critical_thinking'
  | 'mental_models'
  | 'perspective_taking'
  | 'adaptability'
  | 'independence'
  | 'creativity'

export type HTTScores = Record<HTTCapabilityKey, number>

// ── Table row types ──────────────────────────────────────────

export interface Tenant {
  id: string
  slug: string
  name: string
  display_name: string
  tier: TenantTier
  is_active: boolean
  settings: Json
  created_at: string
  updated_at: string
}

export interface TenantBranding {
  tenant_id: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  font_heading: string
  font_body: string
  tagline: string | null
  custom_domain: string | null
  custom_css: string | null
  updated_at: string
}

export interface TenantModule {
  id: string
  tenant_id: string
  module_key: string
  is_enabled: boolean
  config: Json
  updated_at: string
}

export interface TenantMember {
  id: string
  tenant_id: string
  user_id: string
  role: MemberRole
  is_active: boolean
  invited_by: string | null
  invited_at: string
  last_active_at: string | null
}

export interface ILAdmin {
  id: string
  user_id: string
  il_role: ILRole
  created_at: string
  created_by: string | null
}

export interface Invitation {
  id: string
  tenant_id: string
  email: string
  role: MemberRole
  token: string
  invited_by: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  tenant_id: string | null
  actor_id: string | null
  actor_is_il: boolean
  impersonating: string | null
  action: string
  resource_type: string
  resource_id: string | null
  metadata: Json
  created_at: string
}

export interface Product {
  id: string
  tenant_id: string
  type: ProductType
  name: string
  description: string | null
  data: Json
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Innovation {
  id: string
  tenant_id: string
  title: string
  stage: InnovationStage
  data: Json
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface StaffSkill {
  id: string
  tenant_id: string
  name: string
  department: string | null
  role_title: string | null
  skills: Json
  data: Json
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface HTTBaseline {
  id: string
  tenant_id: string
  user_id: string
  stage: number
  scores: HTTScores
  source: HTTSource
  notes: string | null
  assessed_at: string
  created_at: string
}

export interface HTTInteraction {
  id: string
  tenant_id: string
  user_id: string
  module_context: string | null
  prompt_type: HTTPromptType
  capability_focus: HTTCapabilityKey | null
  prompt_text: string | null
  response_signal: Json
  created_at: string
}

export interface HTTBenchmark {
  id: string
  cohort: string
  period: string
  capability: HTTCapabilityKey
  p25: number | null
  p50: number | null
  p75: number | null
  n_orgs: number
  published: boolean
  computed_at: string
}

// ── JWT custom claims (injected by Edge Function hook) ───────
export interface CustomJWTClaims {
  tenant_id: string | null
  role: MemberRole | null
  is_il_admin: boolean
  il_role: ILRole | null
  sub: string  // auth.users.id
  email: string
}

// ── Module keys ──────────────────────────────────────────────
export const MODULE_KEYS = [
  'products',
  'current_state',
  'future_state',
  'innovations',
  'ideas',
  'market_intel',
  'competition',
  'structure',
  'staff_skills',
  'compensation',
  'finance',
  'collaboration',
  'surveys',
  'bod_management',
  'relationship_network',
  'downloads',
  'htt',
] as const

export type ModuleKey = typeof MODULE_KEYS[number]
