import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) redirect('/dashboard')

  // Get all users with their district assignments
  const { data: users } = await supabase
    .from('profiles')
    .select('*, user_districts(district_id, districts(name))')
    .order('name')

  const { data: districts } = await supabase
    .from('districts')
    .select('id, name')
    .eq('active', true)
    .order('sort_order')

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    DISTRICT_LEADER: 'District Leader',
    ACCOUNTING: 'Accounting',
    CHILDREN_COORDINATOR: "Children's Coordinator",
    YOUTH_COORDINATOR: 'Youth Coordinator',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            Users sign up via the login page. Assign roles and districts below.
          </p>
        </div>
        {(users || []).length > 0 ? (
          <div className="divide-y divide-gray-100">
            {(users || []).map((u: any) => (
              <div key={u.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(u.roles || []).map((role: string) => (
                        <span key={role} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {roleLabels[role] || role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Districts:</p>
                    <div className="flex flex-wrap gap-1 mt-1 justify-end">
                      {(u.user_districts || []).map((ud: any) => (
                        <span key={ud.district_id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {ud.districts?.name}
                        </span>
                      ))}
                      {(u.user_districts || []).length === 0 && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}
