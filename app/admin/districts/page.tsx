import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createDistrict } from '@/app/admin/actions'

export default async function AdminDistrictsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) redirect('/dashboard')

  const { data: districts } = await supabase
    .from('districts')
    .select('*')
    .order('sort_order')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Districts</h1>

      {/* Add district form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New District</h2>
        <form action={createDistrict} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. District 1"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              name="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Optional description"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Add District
          </button>
        </form>
      </div>

      {/* Districts list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Districts</h2>
        </div>
        {(districts || []).length > 0 ? (
          <div className="divide-y divide-gray-100">
            {(districts || []).map((district: any) => (
              <div key={district.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{district.name}</p>
                  {district.description && (
                    <p className="text-sm text-gray-500">{district.description}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${district.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {district.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            No districts yet. Add one above.
          </div>
        )}
      </div>
    </div>
  )
}
