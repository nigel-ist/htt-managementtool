/**
 * IL Admin — All users across all tenants.
 * Uses the Supabase service client to query auth.users joined with tenant_members.
 */
import { getAllUsers, validateUserFromAdmin, deleteUserFromAdmin, inviteUserFromAdmin } from './actions'
import AdminUsersClient from './admin-users-client'

export const metadata = { title: 'Users' }

export default async function UsersPage() {
  const users = await getAllUsers()
  return (
    <AdminUsersClient
      users={users}
      validateUser={validateUserFromAdmin}
      deleteUser={deleteUserFromAdmin}
      inviteUser={inviteUserFromAdmin}
    />
  )
}
