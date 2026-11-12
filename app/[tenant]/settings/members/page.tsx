import { getMembers, changeRole, validateMemberFromSettings, deleteMember } from './actions'
import MembersClient from './members-client'

export const metadata = { title: 'Members — Settings' }

interface Props { params: { tenant: string } }

export default async function MembersPage({ params }: Props) {
  const { tenant: slug } = params
  const members = await getMembers(slug)

  return (
    <MembersClient
      tenantSlug={slug}
      members={members}
      changeRole={changeRole}
      validateMember={validateMemberFromSettings}
      deleteMember={deleteMember}
    />
  )
}
