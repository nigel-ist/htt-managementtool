/**
 * Types and constants for the Invitations module.
 * Kept separate from actions.ts so non-async values can be exported safely.
 */

import type { MemberRole } from '@/lib/types/database'

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

/** Roles that can be assigned when sending an invitation. */
export const INVITATION_ROLES: { value: MemberRole; label: string; description: string }[] = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view all modules but cannot edit anything.',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Can create and edit content across all modules.',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access including settings, invitations, and member management.',
  },
]
