'use client'

import { useEffect, useState } from 'react'

interface HuntTimerProps {
  startTime: string
}

export function HuntTimer({ startTime }: HuntTimerProps) {
  const [timeInfo, setTimeInfo] = useState<{
    elapsed: string
    remaining: string
    isClosed: boolean
  } | null>(null)

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date()
      const start = new Date(startTime)
      const endTime = new Date(start.getTime() + 24 * 60 * 60 * 1000) // 24 hours after start

      // Calculate elapsed time
      const elapsedMs = now.getTime() - start.getTime()
      const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60))
      const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))

      // Calculate remaining time
      const remainingMs = endTime.getTime() - now.getTime()
      const isClosed = remainingMs <= 0

      let elapsed = ''
      let remaining = ''

      if (elapsedHours > 0) {
        elapsed = `${elapsedHours}h ${elapsedMinutes}m fa`
      } else if (elapsedMinutes > 0) {
        elapsed = `${elapsedMinutes}m fa`
      } else {
        elapsed = 'Appena iniziata'
      }

      if (!isClosed) {
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
        remaining = `${remainingHours}h ${remainingMinutes}m`
      }

      setTimeInfo({ elapsed, remaining, isClosed })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [startTime])

  if (!timeInfo) return null

  return (
    <div className="mt-2 pt-2 border-t border-dashed border-[#C8E6C9] space-y-1">
      <div className="text-xs text-[#666]">
        Iniziata: <span className="font-bold text-[#4CAF50]">{timeInfo.elapsed}</span>
      </div>
      {timeInfo.isClosed ? (
        <div className="text-xs text-[#E57373] font-bold">
          ⏱️ Chiusa (24 ore terminate)
        </div>
      ) : (
        <div className="text-xs text-[#666]">
          Termina tra: <span className="font-bold text-[#FF6B6B]">{timeInfo.remaining}</span>
        </div>
      )}
    </div>
  )
}
