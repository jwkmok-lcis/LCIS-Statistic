'use client'

import { useState } from 'react'
import { getOrCreateWeeklyRecord, saveProphesyingStats } from '@/app/leader/actions'
import Link from 'next/link'

export default function ProphesyingForm({
  districtId,
  districtName,
  weekDate,
  existingCount,
  existingNotes,
}: {
  districtId: string
  districtName: string
  weekDate: string
  existingCount: number | null
  existingNotes: string | null
}) {
  const [count, setCount] = useState(existingCount ?? 0)
  const [notes, setNotes] = useState(existingNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const record = await getOrCreateWeeklyRecord(districtId, weekDate)
      await saveProphesyingStats(record.id, count, notes || undefined)
      setSaved(true)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href={`/leader/dashboard?week=${weekDate}&district=${districtId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to submissions
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Prophesying Meeting</h1>
      <p className="text-sm text-gray-500 mb-6">
        {districtName} · Week of {new Date(weekDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Prophecies Given
          </label>
          <input
            type="number"
            min={0}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            ✓ Saved successfully
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
