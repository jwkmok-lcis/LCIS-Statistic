import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile | null
  const roles = p?.roles || []
  const isAdmin = roles.includes('ADMIN')
  const firstName = (p?.name || '').split(' ')[0] || 'there'

  // Get user's assigned districts
  const { data: userDistricts } = await supabase
    .from('user_districts')
    .select('district_id, districts(id, name)')
    .eq('user_id', user.id)

  // Get summary counts
  const districtIds = (userDistricts || []).map((ud: any) => ud.district_id)

  let totalDistrictsCount = 0
  if (isAdmin) {
    const { count } = await supabase.from('districts').select('*', { count: 'exact', head: true }).eq('active', true)
    totalDistrictsCount = count || 0
  } else {
    totalDistrictsCount = districtIds.length
  }

  // Recent weekly records
  const weeklyQuery = supabase
    .from('weekly_records')
    .select('id, district_id, week_date, districts(name)')
    .order('week_date', { ascending: false })
    .limit(10)

  if (!isAdmin && districtIds.length > 0) {
    weeklyQuery.in('district_id', districtIds)
  }

  const { data: recentRecords } = await weeklyQuery

  // Role-based quick links
  const quickLinks: { label: string; href: string; icon: string; description: string }[] = [
    { label: 'Submit Statistics', href: '/leader/dashboard', icon: '📝', description: 'Enter weekly district stats' },
    { label: 'Reports', href: '/reports', icon: '📊', description: 'View attendance & offerings' },
  ]

  if (isAdmin || roles.includes('ACCOUNTING')) {
    quickLinks.push({ label: 'Offerings', href: '/accounting/dashboard', icon: '💰', description: 'Electronic offering entries' })
  }
  if (isAdmin) {
    quickLinks.push({ label: 'Admin Panel', href: '/admin/dashboard', icon: '⚙️', description: 'Manage districts & users' })
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin
            ? `You have ${totalDistrictsCount} active district${totalDistrictsCount !== 1 ? 's' : ''}.`
            : districtIds.length > 0
              ? `You're assigned to ${districtIds.length} district${districtIds.length !== 1 ? 's' : ''}.`
              : 'Ask an admin to assign you to a district to get started.'}
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 hover:shadow transition group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{link.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition">{link.label}</h3>
                <p className="text-xs text-gray-500">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* My districts + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span>🏘️</span>
            <h2 className="font-semibold text-gray-900">My Districts</h2>
          </div>
          {(userDistricts || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(userDistricts || []).map((ud: any) => (
                <span key={ud.district_id} className="inline-block bg-blue-50 text-blue-800 text-sm px-3 py-1 rounded-lg">
                  {ud.districts?.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No districts assigned yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span>📈</span>
            <h2 className="font-semibold text-gray-900">Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalDistrictsCount}</p>
              <p className="text-xs text-gray-500">{isAdmin ? 'Total Districts' : 'My Districts'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(recentRecords || []).length}</p>
              <p className="text-xs text-gray-500">Recent Submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Submissions</h2>
          <Link href="/reports" className="text-xs text-blue-600 hover:text-blue-800 transition">
            View all →
          </Link>
        </div>
        {(recentRecords || []).length > 0 ? (
          <div className="divide-y divide-gray-100">
            {(recentRecords || []).map((record: any) => (
              <div key={record.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {record.districts?.name || 'Unknown District'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Week of {new Date(record.week_date).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <Link
                  href={`/leader/dashboard?week=${record.week_date}&district=${record.district_id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-gray-400">
            <p className="mb-2">No weekly records yet.</p>
            <Link href="/leader/dashboard" className="text-blue-600 hover:underline text-sm">
              Submit your first weekly statistics →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
