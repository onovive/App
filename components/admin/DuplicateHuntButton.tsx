'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Database } from '@/lib/types/database'

type Hunt = Database['public']['Tables']['hunts']['Row']
type Clue = Database['public']['Tables']['clues']['Row']

interface DuplicateHuntButtonProps {
  huntId: string
}

export default function DuplicateHuntButton({ huntId }: DuplicateHuntButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDuplicate = async () => {
    if (isDuplicating) return

    const confirmed = window.confirm('Vuoi duplicare questa caccia?')
    if (!confirmed) return

    setIsDuplicating(true)

    try {
      // Fetch the original hunt
      const { data: originalHunt, error: huntError } = await supabase
        .from('hunts')
        .select('*')
        .eq('id', huntId)
        .single<Hunt>()

      if (huntError || !originalHunt) {
        throw new Error('Failed to fetch hunt')
      }

      // Create a new hunt with the same data (but new id and modified title)
      const { data: newHunt, error: createError } = await (supabase as any)
        .from('hunts')
        .insert({
          title: `${originalHunt.title} (Copy)`,
          description: originalHunt.description,
          start_time: originalHunt.start_time,
          duration_minutes: originalHunt.duration_minutes,
          cover_image_url: originalHunt.cover_image_url,
          prizes: originalHunt.prizes,
          status: 'upcoming', // Always set to upcoming for duplicates
          clues_count: originalHunt.clues_count,
        })
        .select()
        .single()

      if (createError || !newHunt) {
        throw new Error('Failed to create duplicate hunt')
      }

      // Fetch and duplicate all clues
      const { data: originalClues, error: cluesError } = await (supabase as any)
        .from('clues')
        .select('*')
        .eq('hunt_id', huntId)
        .order('clue_number', { ascending: true }) as { data: Clue[] | null; error: any }

      if (cluesError) {
        throw new Error('Failed to fetch clues')
      }

      if (originalClues && originalClues.length > 0) {
        const newClues = originalClues.map((clue) => ({
          hunt_id: newHunt.id,
          clue_number: clue.clue_number,
          clue_text: clue.clue_text,
          hint_text: clue.hint_text,
          correct_answer_criteria: clue.correct_answer_criteria,
          location_hint: clue.location_hint,
        }))

        const { error: insertCluesError } = await (supabase as any)
          .from('clues')
          .insert(newClues)

        if (insertCluesError) {
          throw new Error('Failed to duplicate clues')
        }
      }

      alert('Caccia duplicata con successo!')
      router.refresh()
    } catch (error) {
      console.error('Error duplicating hunt:', error)
      alert('Errore durante la duplicazione della caccia')
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={isDuplicating}
      className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
    >
      {isDuplicating ? '...' : 'Duplicate'}
    </button>
  )
}
