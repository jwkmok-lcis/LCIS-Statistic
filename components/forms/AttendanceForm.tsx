'use client'

import { useState } from 'react'
import { getOrCreateWeeklyRecord, saveAttendance, addMember } from '@/app/leader/actions'
import Link from 'next/link'
import type { Member } from '@/lib/types'

export default function AttendanceForm({
  districtId,
  districtName,
  weekDate,
  meetingType,
  meetingLabel,
  members,
  existingAttendance,
}: {
  districtId: string
  districtName: string
  weekDate: string
  meetingType: 'CHILDREN_MEETING' | 'YOUTH_MEETING'
  meetingLabel: string
  members: Member[]
  existingAttendance: Record<string, boolean> // memberId -> present
}) {
  const [attendance, setAttendance] = useState<Record<string, boolean>>(existingAttendance)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add member form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSchoolYear, setNewSchoolYear] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const presentCount = Object.values(attendance).filter(Boolean).length
  const totalMembers = members.length

  function toggleMember(memberId: string) {
    setAttendance(prev => ({
      ...prev,
      [memberId]: !prev[memberId],
    }))
    setSaved(false)
  }

  function toggleAll(present: boolean) {
    const updated: Record<string, boolean> = {}
    members.forEach(m => { updated[m.id] = present })
    setAttendance(updated)
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const record = await getOrCreateWeeklyRecord(districtId, weekDate)
      await saveAttendance(record.id, meetingType, attendance)
      setSaved(true)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMember() {
    if (!newName.trim()) return
    setAddingMember(true)
    try {
      await addMember(districtId, meetingType, newName.trim(), newSchoolYear.trim() || undefined)
      setNewName('')
      setNewSchoolYear('')
      setShowAddForm(false)
      // Page will revalidate and show updated member list
    } catch (e: any) {
      setError(e.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href={`/leader/dashboard?week=${weekDate}&district=${districtId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to submissions
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{meetingLabel}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {districtName} · Week of {new Date(weekDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {/* Summary bar */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-600">Attendance</p>
          <p className="text-2xl font-bold text-blue-900">{presentCount} / {totalMembers}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
          >
            All Present
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Member list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
        {members.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition ${
                  attendance[member.id] ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className={`font-medium ${attendance[member.id] ? 'text-green-900' : 'text-gray-900'}`}>
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[member.school_year, member.date_of_birth].filter(Boolean).join(' · ') || 'No details'}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  attendance[member.id]
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {attendance[member.id] ? '✓' : ''}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            <p>No members yet.</p>
            <p className="text-sm mt-1">Add members to start taking attendance.</p>
          </div>
        )}
      </div>

      {/* Add member */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition mb-4"
        >
          + Add Member
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Add New Member</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
            <input
              type="text"
              value={newSchoolYear}
              onChange={(e) => setNewSchoolYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Year 7, P5"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddMember}
              disabled={addingMember || !newName.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {addingMember ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          ✓ Attendance saved successfully
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || members.length === 0}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Attendance'}
      </button>
    </div>
  )
}
