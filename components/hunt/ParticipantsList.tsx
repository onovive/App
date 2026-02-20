'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Participant {
  id: string
  user_id: string
  profiles: {
    username: string | null
    avatar_url: string | null
  }
}

interface ParticipantsListProps {
  huntId: string
  userId: string
}

export default function ParticipantsList({ huntId, userId }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial participants
    fetchParticipants()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`hunt_${huntId}_participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hunt_participants',
          filter: `hunt_id=eq.${huntId}`,
        },
        () => {
          // Re-fetch participants when changes occur
          fetchParticipants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [huntId])

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('hunt_participants')
      .select(
        `
        id,
        user_id,
        profiles (
          username,
          avatar_url
        )
      `
      )
      .eq('hunt_id', huntId)
      .order('subscribed_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error fetching participants:', error)
      return
    }

    setParticipants(data as any)
  }

  // Move current user to the front
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.user_id === userId) return -1
    if (b.user_id === userId) return 1
    return 0
  })

  return (
    <div className="flex mt-[10px] overflow-x-auto pb-[10px]">
      {sortedParticipants.length === 0 ? (
        <div className="text-sm text-gray-500">
          Nessun partecipante ancora. Iscriviti per primo!
        </div>
      ) : (
        sortedParticipants.map((participant, index) => (
          <div
            key={participant.id}
            className="w-[35px] h-[35px] rounded-full bg-[#00BCD4] -mr-2 border-2 border-white flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold z-[1]"
            style={{ zIndex: sortedParticipants.length - index }}
          >
            {participant.profiles?.avatar_url ? (
              <img
                src={participant.profiles.avatar_url}
                alt={participant.profiles.username || 'User'}
                width={35}
                height={35}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {participant.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  )
}
