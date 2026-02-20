'use client'

import { useState } from 'react'

interface AnnounceHuntButtonProps {
  huntId: string
  huntTitle: string
}

export default function AnnounceHuntButton({ huntId, huntTitle }: AnnounceHuntButtonProps) {
  const [isAnnouncing, setIsAnnouncing] = useState(false)

  const handleAnnounce = async () => {
    if (!confirm(`Send announcement for "${huntTitle}" to all users with phone numbers?`)) {
      return
    }

    setIsAnnouncing(true)

    try {
      const response = await fetch('/api/notifications/hunt-announced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ huntId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send announcement')
      }

      alert(`Announcement logged!\n\nNote: SMS notifications are currently disabled.\nNotification saved to database.`)
    } catch (error: any) {
      console.error('Announce error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsAnnouncing(false)
    }
  }

  return (
    <button
      onClick={handleAnnounce}
      disabled={isAnnouncing}
      className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
    >
      {isAnnouncing ? 'Sending...' : 'Announce'}
    </button>
  )
}
