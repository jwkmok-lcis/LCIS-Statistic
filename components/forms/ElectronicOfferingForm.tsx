'use client'

import { useState } from 'react'
import { saveElectronicOffering } from '@/app/admin/actions'
import Link from 'next/link'
import type { District, OfferingCategory } from '@/lib/types'

const CATEGORIES: { key: OfferingCategory; label: string }[] = [
  { key: 'GENERAL', label: 'General Offering' },
  { key: 'BUILDING_PROJECT', label: 'Building Project' },
  { key: 'SPECIFIC_PURPOSE', label: 'Specific Purpose' },
  { key: 'DESIGNATED', label: 'Designated Offering' },
]

export default function ElectronicOfferingForm({
  districts,
}: {
  districts: District[]
}) {
  const [districtId, setDistrictId] = useState(districts[0]?.id || '')
  const [weekDate, setWeekDate] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const lastSunday = new Date(today)
    lastSunday.setDate(today.getDate() - dayOfWeek)
    return lastSunday.toISOString().split('T')[0]
  })
  const [category, setCategory] = useState<OfferingCategory>('GENERAL')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const formData = new FormData()
      formData.set('district_id', districtId)
      formData.set('week_date', weekDate)
      formData.set('category', category)
      formData.set('amount', amount)
      formData.set('reference', reference)
      formData.set('notes', notes)
      const result = await saveElectronicOffering(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setAmount('')
        setReference('')
        setNotes('')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/accounting/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to accounting
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Electronic Offering</h1>
      <p className="text-sm text-gray-500 mb-6">Record electronic offerings received per district</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Date</label>
            <input
              type="date"
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as OfferingCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Reference / Transaction ID</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Any notes..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            ✓ Saved successfully. You can enter another.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !amount}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Electronic Offering'}
        </button>
      </div>
    </div>
  )
}
