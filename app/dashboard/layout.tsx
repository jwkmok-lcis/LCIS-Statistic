import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import type { Profile } from '@/lib/types'

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  DISTRICT_COORDINATOR: 'District Coordinator',
  ACCOUNTING: 'Accounting',
  CHILDREN_COORDINATOR: "Children's Coordinator",
  YOUTH_COORDINATOR: 'Youth Coordinator',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
  const isAccounting = roles.includes('ACCOUNTING')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-gray-900">
              Church Statistics
            </Link>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition">
                Dashboard
              </Link>
              <Link href="/leader/dashboard" className="text-gray-600 hover:text-gray-900 transition">
                Submit Stats
              </Link>
              {(isAdmin || isAccounting) && (
                <Link href="/accounting/dashboard" className="text-gray-600 hover:text-gray-900 transition">
                  Offerings
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900 transition">
                  Admin
                </Link>
              )}
              <Link href="/reports" className="text-gray-600 hover:text-gray-900 transition">
                Reports
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{p?.name || user.email}</p>
              <p className="text-xs text-gray-500">
                {roles.map(r => roleLabels[r] || r).join(', ')}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
