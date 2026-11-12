/**
 * Invitations page — /[tenant]/invitations
 * Invite by email, manage invite codes, approve pending members.
 */
import { redirect } from 'next/navigation'
import { getServerJWTClaims } from '@/lib/supabase/server'
import { getInvitations, sendInvitation, revokeInvitation } from './actions'
import { getInviteCodes, createInviteCode, toggleInviteCode, deleteInviteCode, getPendingMembers, validateMember, rejectPendingMember } from './invite-codes-actions'
import { INVITATION_ROLES } from './types'
import InvitationsClient from './invitations-client'

export const metadata = { title: 'Invitations' }

interface Props { params: { tenant: string } }

export default async function InvitationsPage({ params }: Props) {
  const { tenant: slug } = params

  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/login?redirect=/${slug}/invitations`)

  const isAdmin = claims.is_il_admin || claims.role === 'admin' || claims.role === 'owner'
  if (!isAdmin) redirect(`/${slug}/dashboard`)

  const [invitations, inviteCodes, pendingMembers] = await Promise.all([
    getInvitations(slug),
    getInviteCodes(slug),
    getPendingMembers(slug),
  ])

  return (
    <InvitationsClient
      tenantSlug={slug}
      invitations={invitations}
      invitationRoles={INVITATION_ROLES}
      inviteCodes={inviteCodes}
      pendingMembers={pendingMembers}
      sendInvitation={sendInvitation}
      revokeInvitation={revokeInvitation}
      createInviteCode={createInviteCode}
      toggleInviteCode={toggleInviteCode}
      deleteInviteCode={deleteInviteCode}
      validateMember={validateMember}
      rejectPendingMember={rejectPendingMember}
    />
  )
}
