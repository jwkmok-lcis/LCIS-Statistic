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

  // Get user's assigned districts
  const { data: userDistricts } = await supabase
    .from('user_districts')
    .select('district_id, districts(id, name)')
    .eq('user_id', user.id)

  // Get summary counts (admin sees all, leader sees own districts)
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Districts</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalDistrictsCount}</p>
          <p className="text-xs text-gray-400 mt-1">{isAdmin ? 'Total active' : 'Assigned to you'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">My Districts</p>
          <div className="mt-1">
            {(userDistricts || []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(userDistricts || []).map((ud: any) => (
                  <span key={ud.district_id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                    {ud.districts?.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No districts assigned</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Quick Actions</p>
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href="/leader/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800 transition"
            >
              → Submit weekly statistics
            </Link>
            <Link
              href="/reports"
              className="text-sm text-blue-600 hover:text-blue-800 transition"
            >
              → View reports
            </Link>
          </div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
        </div>
        {(recentRecords || []).length > 0 ? (
          <div className="divide-y divide-gray-100">
            {(recentRecords || []).map((record: any) => (
              <div key={record.id} className="px-6 py-3 flex items-center justify-between">
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
          <div className="px-6 py-12 text-center text-gray-400">
            <p>No weekly records yet.</p>
            <Link href="/leader/dashboard" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Submit your first weekly statistics →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
