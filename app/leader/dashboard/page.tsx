import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaderDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; district?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's districts
  const { data: userDistricts } = await supabase
    .from('user_districts')
    .select('district_id, districts(id, name)')
    .eq('user_id', user.id)

  // Check if admin (admins see all districts)
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.roles?.includes('ADMIN')

  let districts: any[] = []
  if (isAdmin) {
    const { data } = await supabase.from('districts').select('*').eq('active', true).order('sort_order')
    districts = data || []
  } else {
    districts = (userDistricts || []).map((ud: any) => ud.districts).filter(Boolean)
  }

  if (districts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Submit Weekly Statistics</h1>
        <p className="text-gray-500">You are not assigned to any district yet. Please contact an admin.</p>
      </div>
    )
  }

  const selectedDistrictId = params.district || districts[0]?.id
  const selectedDistrict = districts.find((d: any) => d.id === selectedDistrictId) || districts[0]

  // Default to most recent Sunday
  const today = new Date()
  const dayOfWeek = today.getDay()
  const lastSunday = new Date(today)
  lastSunday.setDate(today.getDate() - dayOfWeek)
  const weekDate = params.week || lastSunday.toISOString().split('T')[0]

  // Get existing weekly record if any
  const { data: weeklyRecord } = await supabase
    .from('weekly_records')
    .select('*')
    .eq('district_id', selectedDistrict.id)
    .eq('week_date', weekDate)
    .single()

  // Get existing stats if weekly record exists
  let lordsTableStats = null
  let prophesyingStats = null
  let smallGroupStats = null
  let offeringRecords: any[] = []

  if (weeklyRecord) {
    const [lt, pr, sg, of] = await Promise.all([
      supabase.from('lords_table_stats').select('*').eq('weekly_record_id', weeklyRecord.id).single(),
      supabase.from('prophesying_stats').select('*').eq('weekly_record_id', weeklyRecord.id).single(),
      supabase.from('small_group_stats').select('*').eq('weekly_record_id', weeklyRecord.id).single(),
      supabase.from('offering_records').select('*').eq('weekly_record_id', weeklyRecord.id),
    ])
    lordsTableStats = lt.data
    prophesyingStats = pr.data
    smallGroupStats = sg.data
    offeringRecords = of.data || []
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit Weekly Statistics</h1>

      {/* District & Week selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <form className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select
              name="district"
              defaultValue={selectedDistrict.id}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {districts.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week (Lord&apos;s Day)</label>
            <input
              type="date"
              name="week"
              defaultValue={weekDate}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
            Load
          </button>
        </form>
      </div>

      {/* Submission sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lord's Table */}
        <Link
          href={`/leader/lords-table?week=${weekDate}&district=${selectedDistrict.id}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            Lord&apos;s Table Meeting
          </h3>
          <p className="text-sm text-gray-500 mt-1">Attendance count</p>
          {lordsTableStats && (
            <p className="text-2xl font-bold text-blue-600 mt-2">{lordsTableStats.attendance}</p>
          )}
          {!lordsTableStats && (
            <p className="text-sm text-amber-600 mt-2">Not submitted yet →</p>
          )}
        </Link>

        {/* Prophesying */}
        <Link
          href={`/leader/prophesying?week=${weekDate}&district=${selectedDistrict.id}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            Prophesying Meeting
          </h3>
          <p className="text-sm text-gray-500 mt-1">Number of prophecies</p>
          {prophesyingStats && (
            <p className="text-2xl font-bold text-blue-600 mt-2">{prophesyingStats.prophecy_count}</p>
          )}
          {!prophesyingStats && (
            <p className="text-sm text-amber-600 mt-2">Not submitted yet →</p>
          )}
        </Link>

        {/* Small Group */}
        <Link
          href={`/leader/small-group?week=${weekDate}&district=${selectedDistrict.id}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            Small Group Meeting
          </h3>
          <p className="text-sm text-gray-500 mt-1">Adults, youth, children counts</p>
          {smallGroupStats && (
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-lg font-bold text-blue-600">{smallGroupStats.adult_count}</p>
                <p className="text-xs text-gray-400">Adults</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{smallGroupStats.highschooler_count}</p>
                <p className="text-xs text-gray-400">Youth</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{smallGroupStats.children_count}</p>
                <p className="text-xs text-gray-400">Children</p>
              </div>
            </div>
          )}
          {!smallGroupStats && (
            <p className="text-sm text-amber-600 mt-2">Not submitted yet →</p>
          )}
        </Link>

        {/* Offering */}
        <Link
          href={`/leader/offerings?week=${weekDate}&district=${selectedDistrict.id}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            Offering
          </h3>
          <p className="text-sm text-gray-500 mt-1">Envelope counts &amp; amounts</p>
          {offeringRecords.length > 0 && (
            <p className="text-sm text-green-600 mt-2">✓ {offeringRecords.length} categories recorded</p>
          )}
          {offeringRecords.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">Not submitted yet →</p>
          )}
        </Link>

        {/* Children's Meeting */}
        <Link
          href={`/leader/children-meeting?week=${weekDate}&district=${selectedDistrict.id}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            Children&apos;s Meeting
          </h3>
          <p className="text-sm text-gray-500 mt-1">Attendance checklist</p>
          <p className="text-sm text-blue-500 mt-2">Check attendance →</p>
        </Link>

        {/* Youth Meeting */}
        <Link
          href={`/leader/youth-meeting?week=${weekDate}&district=${selectedDistrict.id}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            High Schoolers&apos; Meeting
          </h3>
          <p className="text-sm text-gray-500 mt-1">Attendance checklist</p>
          <p className="text-sm text-blue-500 mt-2">Check attendance →</p>
        </Link>
      </div>
    </div>
  )
}
