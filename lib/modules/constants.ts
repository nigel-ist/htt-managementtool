/**
 * Module metadata — labels, descriptions, and sidebar display group.
 * Used in the Settings > Modules page and the per-user override UI.
 */

export interface ModuleMeta {
  label: string
  description: string
  group: string
}

/** Maps module_key → display info. */
export const MODULE_META: Record<string, ModuleMeta> = {
  products:              { label: 'Products',           description: 'Product catalogue and lifecycle management',   group: 'Core' },
  innovations:           { label: 'Innovations',         description: 'Innovation pipeline and stage tracking',       group: 'Core' },
  staff_skills:          { label: 'Staff Skills',        description: 'Team capability mapping and skills matrix',    group: 'Core' },
  current_state:         { label: 'Current State',       description: 'Organisational health scoring',               group: 'Core' },
  future_state:          { label: 'Future State',        description: 'Strategic future-state goal setting',          group: 'Core' },
  structure:             { label: 'Roles & Structure',   description: 'Org structure, roles and RACI matrices',      group: 'Core' },
  htt:                   { label: 'How to Think',        description: 'HTT capability diagnostics and baselines',    group: 'HTT' },
  ideas:                 { label: 'Ideas',               description: 'Idea capture and early-stage pipeline',        group: 'Strategy' },
  market_intel:          { label: 'Market Intel',        description: 'Market intelligence and signals',             group: 'Strategy' },
  competition:           { label: 'Competition',         description: 'Competitor tracking and analysis',            group: 'Strategy' },
  finance:               { label: 'Finance',             description: 'Financial health and planning',               group: 'Strategy' },
  compensation:          { label: 'Compensation',        description: 'Salary banding and remuneration planning',    group: 'Strategy' },
  collaboration:         { label: 'Collaboration',       description: 'Cross-team collaboration tools',              group: 'Strategy' },
  surveys:               { label: 'Surveys',             description: 'Team and stakeholder surveys',                group: 'Engagement' },
  bod_management:        { label: 'Board Management',    description: 'Board pack and governance tools',             group: 'Governance' },
  relationship_network:  { label: 'Relationship Network',description: 'Stakeholder relationship mapping',            group: 'Governance' },
  downloads:             { label: 'Downloads',           description: 'Document library and file downloads',         group: 'Other' },
}

/** Ordered list of role values, lowest → highest. */
export const ROLE_ORDER = ['viewer', 'editor', 'admin', 'owner'] as const
export type RoleOrderItem = typeof ROLE_ORDER[number]

export const ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  editor: 'Editor',
  admin:  'Admin',
  owner:  'Owner',
}
