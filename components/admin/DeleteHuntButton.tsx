'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteHuntButtonProps {
  huntId: string
  huntTitle: string
}

export default function DeleteHuntButton({ huntId, huntTitle }: DeleteHuntButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete hunt "${huntTitle}"? This will also delete all associated clues and participants.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('hunts')
        .delete()
        .eq('id', huntId)

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert(`Error: ${err}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  )
}
