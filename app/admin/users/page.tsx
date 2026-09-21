/**
 * IL Admin — All users across all tenants.
 *
 * Uses the Supabase service client to query auth.users joined with
 * tenant_members, so IL admins can see every user on the platform.
 */
import { createServiceClient } from '@/lib/supabase/server'

interface UserRow {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at: string | null
  tenant_name: string | null
  tenant_slug: string | null
  role: string | null
  is_active: boolean
}

async function getAllUsers(): Promise<UserRow[]> {
  // Service client bypasses RLS — IL admin use only (already verified in layout)
  const supabase = createServiceClient()

  const { data: members, error } = await supabase
    .from('tenant_members')
    .select(`
      user_id, role, is_active,
      tenants(name, slug)
    `)
    .order('user_id')

  if (error) console.error('[admin/users] members query error:', error)
  if (!members) return []

  const userIds = [...new Set(members.map(m => m.user_id))]
  const users: UserRow[] = []

  for (const uid of userIds) {
    const { data: authData } = await supabase.auth.admin.getUserById(uid)
    const member = members.find(m => m.user_id === uid)
    const tenant = (member?.tenants as any)

    users.push({
      id: uid,
      email: authData?.user?.email,
      created_at: authData?.user?.created_at ?? '',
      last_sign_in_at: authData?.user?.last_sign_in_at ?? null,
      tenant_name: tenant?.name ?? null,
      tenant_slug: tenant?.slug ?? null,
      role: member?.role ?? null,
      is_active: member?.is_active ?? false,
    })
  }

  return users
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export default async function UsersPage() {
  const users = await getAllUsers()

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">Users</h1>
        <p className="text-sm text-[rgb(var(--text-3))]">
          {users.length} user{users.length !== 1 ? 's' : ''} across all workspaces
        </p>
      </div>

      {users.length === 0 ? (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-12 text-center">
          <p className="text-sm text-[rgb(var(--text-3))]">No users yet.</p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))]">
                {['Email', 'Workspace', 'Role', 'Joined', 'Last sign in', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-[rgb(var(--surface-2))] transition-colors">
                  <td className="px-4 py-3 text-[rgb(var(--text-1))]">
                    {user.email ?? <span className="text-[rgb(var(--text-3))]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {user.tenant_slug ? (
                      <a
                        href={`/admin/tenants/${user.tenant_slug}`}
                        className="text-[rgb(var(--color-primary))] hover:underline"
                      >
                        {user.tenant_name}
                      </a>
                    ) : (
                      <span className="text-[rgb(var(--text-3))]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--text-2))]">
                    {user.role ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--text-3))] tabular-nums text-xs">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--text-3))] tabular-nums text-xs">
                    {formatDate(user.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${user.is_active ? 'text-[rgb(var(--color-accent))]' : 'text-[rgb(var(--text-3))]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-[rgb(var(--color-accent))]' : 'bg-[rgb(var(--text-3))]'}`} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export const metadata = { title: 'Users' }
