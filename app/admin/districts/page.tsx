'use client'

import { useState, useEffect, useTransition } from 'react'
import { createDistrict, deleteDistrict, reactivateDistrict } from '@/app/admin/actions'
import { createBrowserClient } from '@supabase/ssr'

interface District {
  id: string
  name: string
  active: boolean
  sort_order: number
}

export default function AdminDistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function loadDistricts() {
    const { data } = await supabase
      .from('districts')
      .select('*')
      .order('sort_order')
    setDistricts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadDistricts() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name.trim()) return

    const formData = new FormData()
    formData.set('name', name.trim())

    startTransition(async () => {
      const result = await createDistrict(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`"${name.trim()}" added successfully`)
        setName('')
        loadDistricts()
        setTimeout(() => setSuccess(''), 3000)
      }
    })
  }

  async function handleDelete(district: District) {
    if (!confirm(`Deactivate "${district.name}"? It can be reactivated later.`)) return
    setError('')
    startTransition(async () => {
      const result = await deleteDistrict(district.id)
      if (result?.error) setError(result.error)
      else loadDistricts()
    })
  }

  async function handleReactivate(district: District) {
    setError('')
    startTransition(async () => {
      const result = await reactivateDistrict(district.id)
      if (result?.error) setError(result.error)
      else loadDistricts()
    })
  }

  const activeDistricts = districts.filter(d => d.active)
  const inactiveDistricts = districts.filter(d => !d.active)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Districts</h1>
        <span className="text-sm text-gray-500">{activeDistricts.length} active</span>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Add district form */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">New District Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. District 1"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add District'}
          </button>
        </div>
      </form>

      {/* Districts list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Active Districts</h2>
        </div>
        {loading ? (
          <div className="px-5 py-12 text-center text-gray-400">Loading...</div>
        ) : activeDistricts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activeDistricts.map(district => (
              <div key={district.id} className="px-5 py-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <p className="font-medium text-gray-900">{district.name}</p>
                </div>
                <button
                  onClick={() => handleDelete(district)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-gray-400">
            No active districts. Add one above.
          </div>
        )}
      </div>

      {/* Inactive districts */}
      {inactiveDistricts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-4">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-500">Inactive Districts</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {inactiveDistricts.map(district => (
              <div key={district.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  <p className="text-gray-500">{district.name}</p>
                </div>
                <button
                  onClick={() => handleReactivate(district)}
                  disabled={isPending}
                  className="text-xs text-blue-500 hover:text-blue-700 transition disabled:opacity-50"
                >
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
