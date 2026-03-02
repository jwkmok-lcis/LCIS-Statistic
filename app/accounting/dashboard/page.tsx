import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AccountingDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles, name')
    .eq('id', user.id)
    .single()

  const isAuthorized = profile?.roles?.includes('ACCOUNTING') || profile?.roles?.includes('ADMIN')
  if (!isAuthorized) redirect('/dashboard')

  // Recent electronic offerings
  const { data: recentOfferings } = await supabase
    .from('electronic_offerings')
    .select('*, districts(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Accounting Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/accounting/offerings"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            Enter Electronic Offering
          </h3>
          <p className="text-sm text-gray-500 mt-1">Record electronic/bank transfer offerings per district</p>
          <p className="text-sm text-blue-500 mt-2">Enter offering →</p>
        </Link>

        <Link
          href="/reports"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            Reports
          </h3>
          <p className="text-sm text-gray-500 mt-1">View offering summaries and reports</p>
          <p className="text-sm text-blue-500 mt-2">View reports →</p>
        </Link>
      </div>

      {/* Recent entries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Electronic Offerings</h2>
        </div>
        {recentOfferings && recentOfferings.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentOfferings.map((offering: any) => (
              <div key={offering.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {offering.districts?.name} — {offering.category.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400">
                    Week of {new Date(offering.week_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">${offering.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            No electronic offerings recorded yet.
          </div>
        )}
      </div>
    </div>
  )
}
