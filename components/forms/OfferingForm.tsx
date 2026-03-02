'use client'

import { useState } from 'react'
import { getOrCreateWeeklyRecord, saveOfferingRecord } from '@/app/leader/actions'
import Link from 'next/link'

const CATEGORIES = [
  { key: 'GENERAL', label: 'General Offering' },
  { key: 'BUILDING_PROJECT', label: 'Building Project' },
  { key: 'SPECIFIC_PURPOSE', label: 'Specific Purpose' },
  { key: 'DESIGNATED', label: 'Designated Offering' },
] as const

type CategoryData = {
  envelope_count: number
  total_amount: string
  notes: string
}

export default function OfferingForm({
  districtId,
  districtName,
  weekDate,
  existingRecords,
}: {
  districtId: string
  districtName: string
  weekDate: string
  existingRecords: Array<{
    category: string
    envelope_count: number
    total_amount: number
    notes: string | null
  }>
}) {
  const initialData: Record<string, CategoryData> = {}
  for (const cat of CATEGORIES) {
    const existing = existingRecords.find(r => r.category === cat.key)
    initialData[cat.key] = {
      envelope_count: existing?.envelope_count ?? 0,
      total_amount: existing?.total_amount?.toString() ?? '0',
      notes: existing?.notes ?? '',
    }
  }

  const [data, setData] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField(category: string, field: keyof CategoryData, value: string | number) {
    setData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const record = await getOrCreateWeeklyRecord(districtId, weekDate)
      for (const cat of CATEGORIES) {
        const d = data[cat.key]
        await saveOfferingRecord(
          record.id,
          cat.key,
          d.envelope_count,
          parseFloat(d.total_amount) || 0,
          d.notes || undefined,
        )
      }
      setSaved(true)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Grand totals
  const totalEnvelopes = CATEGORIES.reduce((sum, cat) => sum + (data[cat.key].envelope_count || 0), 0)
  const totalAmount = CATEGORIES.reduce((sum, cat) => sum + (parseFloat(data[cat.key].total_amount) || 0), 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/leader/dashboard?week=${weekDate}&district=${districtId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to submissions
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Offering</h1>
      <p className="text-sm text-gray-500 mb-6">
        {districtName} · Week of {new Date(weekDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      <div className="space-y-4">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">{cat.label}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Envelopes</label>
                <input
                  type="number"
                  min={0}
                  value={data[cat.key].envelope_count}
                  onChange={(e) => updateField(cat.key, 'envelope_count', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Total Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data[cat.key].total_amount}
                  onChange={(e) => updateField(cat.key, 'total_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Grand total */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-blue-600">Total Envelopes</p>
              <p className="text-2xl font-bold text-blue-900">{totalEnvelopes}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-900">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            ✓ Saved successfully
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Categories'}
        </button>
      </div>
    </div>
  )
}
