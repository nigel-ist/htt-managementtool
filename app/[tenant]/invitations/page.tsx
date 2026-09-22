/**
 * Invitations page — /[tenant]/invitations
 *
 * Tenant admins and owners can:
 *  - View all pending and accepted invitations
 *  - Send a new invitation (email + role)
 *  - Copy the backup accept link
 *  - Revoke a pending invitation
 */
import { redirect } from 'next/navigation'
import { getServerJWTClaims } from '@/lib/supabase/server'
import { getInvitations, sendInvitation, revokeInvitation } from './actions'
import { INVITATION_ROLES } from './types'
import InvitationsClient from './invitations-client'

export const metadata = { title: 'Invitations' }

interface Props {
  params: { tenant: string }
}

export default async function InvitationsPage({ params }: Props) {
  const { tenant: slug } = params

  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/login?redirect=/${slug}/invitations`)

  const isAdmin =
    claims.is_il_admin || claims.role === 'admin' || claims.role === 'owner'

  if (!isAdmin) redirect(`/${slug}/dashboard`)

  const invitations = await getInvitations(slug)

  return (
    <InvitationsClient
      tenantSlug={slug}
      invitations={invitations}
      invitationRoles={INVITATION_ROLES}
      sendInvitation={sendInvitation}
      revokeInvitation={revokeInvitation}
    />
  )
}
