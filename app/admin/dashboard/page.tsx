import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) {
    redirect('/dashboard')
  }

  // Get counts
  const [districtsRes, usersRes, campaignsRes] = await Promise.all([
    supabase.from('districts').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('pledge_campaigns').select('*', { count: 'exact', head: true }).eq('active', true),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Districts</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{districtsRes.count || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{usersRes.count || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Pledge Campaigns</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{campaignsRes.count || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/districts"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition"
        >
          <h3 className="font-semibold text-gray-900">Manage Districts</h3>
          <p className="text-sm text-gray-500 mt-1">Add, edit, and organise districts/zones</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition"
        >
          <h3 className="font-semibold text-gray-900">Manage Users</h3>
          <p className="text-sm text-gray-500 mt-1">Assign roles and districts to users</p>
        </Link>

        <Link
          href="/admin/offerings"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition"
        >
          <h3 className="font-semibold text-gray-900">Pledge Campaigns</h3>
          <p className="text-sm text-gray-500 mt-1">Create and manage special pledge offerings</p>
        </Link>

        <Link
          href="/reports"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition"
        >
          <h3 className="font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-500 mt-1">View attendance, offering, and event reports</p>
        </Link>
      </div>
    </div>
  )
}
