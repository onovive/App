'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteClueButtonProps {
  clueId: string
  huntId: string
  clueNumber: number
}

export default function DeleteClueButton({ clueId, huntId, clueNumber }: DeleteClueButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Clue ${clueNumber}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/clues/${clueId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete clue')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting clue:', error)
      alert('Failed to delete clue. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  )
}
