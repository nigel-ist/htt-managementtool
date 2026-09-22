import { redirect } from 'next/navigation'
import { getServerJWTClaims } from '@/lib/supabase/server'
import { getUserModuleStates, getMembers } from '../actions'
import UserModulesClient from './user-modules-client'

export const metadata = { title: 'Member Access — Settings' }

interface Props {
  params: { tenant: string; userId: string }
}

export default async function UserModulesPage({ params }: Props) {
  const { tenant: slug, userId } = params

  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/login?redirect=/${slug}/settings/members/${userId}`)

  const isAdmin =
    claims.is_il_admin || claims.role === 'admin' || claims.role === 'owner'
  if (!isAdmin) redirect(`/${slug}/dashboard`)

  const [{ states, userRole }, members] = await Promise.all([
    getUserModuleStates(slug, userId),
    getMembers(slug),
  ])

  const member = members.find(m => m.userId === userId)
  const userEmail = member?.email ?? userId

  return (
    <UserModulesClient
      tenantSlug={slug}
      userId={userId}
      userEmail={userEmail}
      userRole={userRole}
      states={states}
    />
  )
}
