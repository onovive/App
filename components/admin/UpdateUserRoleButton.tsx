'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UpdateUserRoleButtonProps {
  userId: string
  currentRole: 'user' | 'admin'
  username: string
}

export default function UpdateUserRoleButton({ userId, currentRole, username }: UpdateUserRoleButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggleRole = async () => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? 'promote to admin' : 'demote to user'

    if (!confirm(`Are you sure you want to ${action} "${username}"?`)) {
      return
    }

    setIsUpdating(true)

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ user_role: newRole })
        .eq('id', userId)

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert(`Error: ${err}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleToggleRole}
      disabled={isUpdating}
      className={`text-sm font-medium ${
        currentRole === 'admin'
          ? 'text-orange-600 hover:text-orange-900'
          : 'text-green-600 hover:text-green-900'
      } disabled:opacity-50 mr-4`}
    >
      {isUpdating ? 'Updating...' : currentRole === 'admin' ? 'Demote' : 'Make Admin'}
    </button>
  )
}
