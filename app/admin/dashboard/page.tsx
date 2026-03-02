import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile | null
  if (!p?.roles?.includes('ADMIN')) redirect('/dashboard')

  const firstName = (p?.name || '').split(' ')[0] || 'Admin'

  // Parallel counts
  const [districtsRes, usersRes, campaignsRes, inactiveDistrictsRes, unassignedUsersRes] = await Promise.all([
    supabase.from('districts').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('pledge_campaigns').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('districts').select('*', { count: 'exact', head: true }).eq('active', false),
    supabase.rpc('count_users_without_districts'),
  ])

  const districtCount = districtsRes.count || 0
  const userCount = usersRes.count || 0
  const campaignCount = campaignsRes.count || 0
  const inactiveDistrictCount = inactiveDistrictsRes.count || 0
  // unassignedUsersRes may fail if RPC doesn't exist — handle gracefully
  const unassignedUserCount = typeof unassignedUsersRes.data === 'number' ? unassignedUsersRes.data : null

  // Build alerts
  const alerts: { message: string; href: string; type: 'warning' | 'info' }[] = []
  if (unassignedUserCount && unassignedUserCount > 0) {
    alerts.push({
      message: `${unassignedUserCount} user${unassignedUserCount > 1 ? 's' : ''} missing district assignment`,
      href: '/admin/users',
      type: 'warning',
    })
  }
  if (inactiveDistrictCount > 0) {
    alerts.push({
      message: `${inactiveDistrictCount} inactive district${inactiveDistrictCount > 1 ? 's' : ''}`,
      href: '/admin/districts',
      type: 'info',
    })
  }

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening across the districts today.
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((alert, i) => (
            <Link
              key={i}
              href={alert.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition hover:shadow-sm ${
                alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-300'
                  : 'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-300'
              }`}
            >
              <span className="text-lg">{alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <span className="text-sm font-medium">{alert.message}</span>
              <span className="ml-auto text-xs opacity-60">View →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/districts"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg group-hover:bg-blue-100 transition">
              🏘️
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{districtCount}</p>
              <p className="text-sm text-gray-500">Active Districts</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-lg group-hover:bg-green-100 transition">
              👥
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{userCount}</p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/offerings"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-lg group-hover:bg-purple-100 transition">
              📋
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignCount}</p>
              <p className="text-sm text-gray-500">Pledge Campaigns</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/districts"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏘️</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Districts</h3>
              <p className="text-sm text-gray-500">Add, edit, and organise districts</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Users</h3>
              <p className="text-sm text-gray-500">Create users, assign roles & districts</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/offerings"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Campaigns</h3>
              <p className="text-sm text-gray-500">Create and manage pledge campaigns</p>
            </div>
          </div>
        </Link>

        <Link
          href="/reports"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Reports</h3>
              <p className="text-sm text-gray-500">Attendance, offerings, and analytics</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
