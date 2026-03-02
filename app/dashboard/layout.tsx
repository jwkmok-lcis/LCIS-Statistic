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
  const isChildren = roles.includes('CHILDREN_COORDINATOR')
  const isYouth = roles.includes('YOUTH_COORDINATOR')

  // Build nav items based on roles
  const navItems: { label: string; href: string; icon: string }[] = [
    { label: 'Home', href: '/dashboard', icon: '🏠' },
    { label: 'Submit Stats', href: '/leader/dashboard', icon: '📝' },
  ]

  if (isChildren) {
    navItems.push({ label: "Children", href: '/leader/children-meeting', icon: '👧' })
  }
  if (isYouth) {
    navItems.push({ label: 'Youth', href: '/leader/youth-meeting', icon: '🧑' })
  }
  if (isAdmin || isAccounting) {
    navItems.push({ label: 'Offerings', href: '/accounting/dashboard', icon: '💰' })
  }
  if (isAdmin) {
    navItems.push({ label: 'Admin', href: '/admin/dashboard', icon: '⚙️' })
  }
  navItems.push({ label: 'Reports', href: '/reports', icon: '📊' })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-gray-900">
              ⛪ Church Stats
            </Link>
            <div className="hidden md:flex items-center gap-1 text-sm">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{p?.name || user.email}</p>
              <p className="text-xs text-gray-500">
                {roles.map(r => roleLabels[r] || r).join(' · ')}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 mt-2 overflow-x-auto pb-1 text-sm">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition whitespace-nowrap flex-shrink-0"
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
