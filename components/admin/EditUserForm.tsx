'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface EditUserFormProps {
  user: Profile
}

const explorerTypes = [
  { value: 'Urban', label: 'ESPLORATORE IMPULSIVO', color: 'bg-[#4CAF50]' },
  { value: 'Trail', label: 'CARTOGRAFO SELVAGGIO', color: 'bg-[#2196F3]' },
  { value: 'Mystery', label: 'RICERCATORE RANDAGIO', color: 'bg-[#FF9800]' },
  { value: 'Geo', label: 'ESPLORATORE LATERALE', color: 'bg-[#9C27B0]' },
  { value: 'Riddle', label: 'DETECTIVE CREPUSCOLARE', color: 'bg-[#F44336]' },
  { value: 'Digital', label: 'INVESTIGATORE VISIONARIO', color: 'bg-[#00BCD4]' },
]

const userRoles = [
  { value: 'user', label: 'User', color: 'bg-gray-100 text-gray-800' },
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
]

export default function EditUserForm({ user }: EditUserFormProps) {
  const [username, setUsername] = useState(user.username || '')
  const [explorerType, setExplorerType] = useState(user.explorer_type || '')
  const [userRole, setUserRole] = useState<string>(user.user_role || 'user')
  const [onboardingCompleted, setOnboardingCompleted] = useState(user.onboarding_completed)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      alert('Username cannot be empty')
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          username: username.trim(),
          explorer_type: explorerType || null,
          user_role: userRole,
          onboarding_completed: onboardingCompleted,
        })
        .eq('id', user.id)

      if (error) throw error

      alert('User updated successfully!')
      router.push('/admin/users')
      router.refresh()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          Username *
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>

      {/* Explorer Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explorer Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {explorerTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setExplorerType(type.value)}
              className={`px-4 py-3 rounded-lg font-semibold text-white text-sm transition-all ${
                explorerType === type.value
                  ? `${type.color} ring-2 ring-offset-2 ring-indigo-500`
                  : `${type.color} opacity-50 hover:opacity-75`
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        {explorerType && (
          <button
            type="button"
            onClick={() => setExplorerType('')}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* User Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User Role *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {userRoles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => setUserRole(role.value)}
              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                userRole === role.value
                  ? `${role.color} ring-2 ring-offset-2 ring-indigo-500`
                  : `${role.color} opacity-50 hover:opacity-75`
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding Status */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={onboardingCompleted}
            onChange={(e) => setOnboardingCompleted(e.target.checked)}
            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Onboarding Completed
          </span>
        </label>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 border-t border-[#EFEFEF]">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/users')}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
