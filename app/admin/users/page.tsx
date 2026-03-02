'use client'

import { useState, useEffect, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  createUser,
  updateUserRoles,
  assignUserToDistrict,
  removeUserFromDistrict,
  deactivateUser,
} from '@/app/admin/actions'

const ALL_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DISTRICT_COORDINATOR', label: 'District Coordinator' },
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'CHILDREN_COORDINATOR', label: "Children's Coordinator" },
  { value: 'YOUTH_COORDINATOR', label: 'Youth Coordinator' },
]

interface UserProfile {
  id: string
  email: string
  name: string
  roles: string[]
  active: boolean
  user_districts: { district_id: string; districts: { name: string } | null }[]
}

interface District {
  id: string
  name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Create form state
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRoles, setNewRoles] = useState<string[]>(['DISTRICT_COORDINATOR'])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function loadData() {
    const [usersRes, districtsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, user_districts(district_id, districts(name))')
        .order('name'),
      supabase
        .from('districts')
        .select('id, name')
        .eq('active', true)
        .order('sort_order'),
    ])
    setUsers(usersRes.data || [])
    setDistricts(districtsRes.data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function clearMessages() { setError(''); setSuccess('') }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    clearMessages()

    const formData = new FormData()
    formData.set('email', newEmail)
    formData.set('name', newName)
    formData.set('password', newPassword)
    newRoles.forEach(r => formData.append('roles', r))

    startTransition(async () => {
      const result = await createUser(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`User "${newName}" created successfully`)
        setNewEmail('')
        setNewName('')
        setNewPassword('')
        setNewRoles(['DISTRICT_COORDINATOR'])
        setShowCreateForm(false)
        loadData()
        setTimeout(() => setSuccess(''), 4000)
      }
    })
  }

  async function handleToggleRole(userId: string, currentRoles: string[], role: string) {
    clearMessages()
    const newRolesArr = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]

    if (newRolesArr.length === 0) {
      setError('A user must have at least one role')
      return
    }

    startTransition(async () => {
      const result = await updateUserRoles(userId, newRolesArr)
      if (result?.error) setError(result.error)
      else loadData()
    })
  }

  async function handleAssignDistrict(userId: string, districtId: string) {
    clearMessages()
    startTransition(async () => {
      const result = await assignUserToDistrict(userId, districtId)
      if (result?.error) setError(result.error)
      else loadData()
    })
  }

  async function handleRemoveDistrict(userId: string, districtId: string) {
    clearMessages()
    startTransition(async () => {
      const result = await removeUserFromDistrict(userId, districtId)
      if (result?.error) setError(result.error)
      else loadData()
    })
  }

  async function handleDeactivate(userId: string, userName: string) {
    if (!confirm(`Deactivate user "${userName}"?`)) return
    clearMessages()
    startTransition(async () => {
      const result = await deactivateUser(userId)
      if (result?.error) setError(result.error)
      else { setSuccess(`User deactivated`); loadData() }
    })
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading users...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {showCreateForm ? 'Cancel' : '+ Create User'}
        </button>
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

      {/* Create user form */}
      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map(role => (
                <label
                  key={role.value}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition ${
                    newRoles.includes(role.value)
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={newRoles.includes(role.value)}
                    onChange={e => {
                      if (e.target.checked) setNewRoles([...newRoles, role.value])
                      else setNewRoles(newRoles.filter(r => r !== role.value))
                    }}
                    className="sr-only"
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      {/* Users list */}
      <div className="space-y-3">
        {users.map(u => {
          const isEditing = editingUserId === u.id
          const assignedDistrictIds = (u.user_districts || []).map(ud => ud.district_id)
          const unassignedDistricts = districts.filter(d => !assignedDistrictIds.includes(d.id))

          return (
            <div
              key={u.id}
              className={`bg-white rounded-xl shadow-sm border transition ${
                !u.active ? 'border-gray-100 opacity-60' : isEditing ? 'border-blue-300' : 'border-gray-200'
              }`}
            >
              <div className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{u.name}</p>
                      {!u.active && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>

                    {/* Roles */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(u.roles || []).map(role => (
                        <span
                          key={role}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                        >
                          {ALL_ROLES.find(r => r.value === role)?.label || role}
                        </span>
                      ))}
                    </div>

                    {/* Districts */}
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="text-xs text-gray-400 mr-1">Districts:</span>
                      {(u.user_districts || []).length > 0 ? (
                        (u.user_districts || []).map(ud => (
                          <span
                            key={ud.district_id}
                            className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 pl-2 pr-1 py-0.5 rounded-full"
                          >
                            {ud.districts?.name}
                            {isEditing && (
                              <button
                                onClick={() => handleRemoveDistrict(u.id, ud.district_id)}
                                disabled={isPending}
                                className="hover:text-red-600 transition ml-0.5"
                                title="Remove district"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-amber-600">No districts assigned</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingUserId(isEditing ? null : u.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition ml-4 whitespace-nowrap"
                  >
                    {isEditing ? 'Done' : 'Edit'}
                  </button>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Role toggles */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_ROLES.map(role => (
                          <button
                            key={role.value}
                            onClick={() => handleToggleRole(u.id, u.roles || [], role.value)}
                            disabled={isPending}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                              (u.roles || []).includes(role.value)
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {(u.roles || []).includes(role.value) ? '✓ ' : ''}{role.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assign district */}
                    {unassignedDistricts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Assign to District</p>
                        <div className="flex flex-wrap gap-2">
                          {unassignedDistricts.map(d => (
                            <button
                              key={d.id}
                              onClick={() => handleAssignDistrict(u.id, d.id)}
                              disabled={isPending}
                              className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
                            >
                              + {d.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deactivate */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleDeactivate(u.id, u.name)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-700 transition"
                      >
                        Deactivate user
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No users found. Create one above.
        </div>
      )}
    </div>
  )
}
