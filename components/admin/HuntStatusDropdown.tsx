'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getHuntStatusColor } from '@/lib/utils/hunt-status'

interface HuntStatusDropdownProps {
  huntId: string
  currentStatus: string
}

export default function HuntStatusDropdown({ huntId, currentStatus }: HuntStatusDropdownProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return

    setIsUpdating(true)
    const supabase = createClient()

    const { error } = await (supabase as any)
      .from('hunts')
      .update({ status: newStatus })
      .eq('id', huntId)

    if (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
      setIsUpdating(false)
    } else {
      setStatus(newStatus)

      // Send "Hunt Starting" notification when status changes to active
      if (newStatus === 'active') {
        fetch('/api/notifications/hunt-starting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ huntId }),
        }).catch((err) => console.error('Hunt starting notification error:', err))
      }

      // Send "Results Published" notification when status changes to completed
      if (newStatus === 'completed') {
        fetch('/api/notifications/results-published', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ huntId }),
        }).catch((err) => console.error('Results published notification error:', err))
      }

      // Refresh the page data without a hard reload
      router.refresh()
      setIsUpdating(false)
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={isUpdating}
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 border-0 cursor-pointer ${getHuntStatusColor(status)} ${
        isUpdating ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <option value="upcoming">upcoming</option>
      <option value="active">active</option>
      <option value="completed">completed</option>
      <option value="cancelled">cancelled</option>
    </select>
  )
}
