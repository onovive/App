'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubscribeButtonProps {
  huntId: string
  userId: string
  isSubscribed: boolean
}

export default function SubscribeButton({
  huntId,
  userId,
  isSubscribed: initialIsSubscribed,
}: SubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubscribe = async () => {
    setIsLoading(true)

    try {
      if (isSubscribed) {
        // Unsubscribe
        console.log('Attempting to unsubscribe:', { user_id: userId, hunt_id: huntId })

        const { error } = await supabase
          .from('hunt_participants')
          .delete()
          .eq('user_id', userId)
          .eq('hunt_id', huntId)

        if (error) {
          console.error('Error unsubscribing:', error)
          alert(`Errore: ${error.message}`)
        } else {
          console.log('Successfully unsubscribed!')
          setIsSubscribed(false)
          window.location.reload()
        }
      } else {
        // Subscribe
        console.log('Attempting to subscribe:', { user_id: userId, hunt_id: huntId })

        const { data, error } = await (supabase as any).from('hunt_participants').insert({
          user_id: userId,
          hunt_id: huntId,
        }).select()

        console.log('Subscribe response:', { data, error })

        if (error) {
          console.error('Error subscribing:', error)
          alert(`Errore: ${error.message}`)
        } else {
          console.log('Successfully subscribed!')
          setIsSubscribed(true)

          // Send WhatsApp notification (non-blocking)
          fetch('/api/notifications/hunt-joined', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ huntId, userId }),
          }).catch((err) => console.error('Notification error:', err))

          window.location.reload()
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert(`Errore imprevisto: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`w-full px-[15px] py-[15px] border shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium uppercase cursor-pointer text-center transition-all ${
        isSubscribed
          ? 'bg-gradient-to-b from-[#FF6B6B] to-[#EE5A52] text-white border-[#FF6B6B] hover:from-[#EE5A52] hover:to-[#DC4E45] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15)]'
          : 'bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border-[#BBBBBB] hover:bg-gradient-to-b hover:from-white hover:to-[#EFEFEF] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)]'
      }`}
    >
      {isLoading
        ? (isSubscribed ? 'Annullamento...' : 'Iscrizione...')
        : isSubscribed
          ? 'ANNULLA ISCRIZIONE'
          : 'ISCRIVITI'}
    </button>
  )
}
