'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTimer(huntId: string, autoStart = false) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)

  // Load timer from database on mount - use hunt's start_time
  useEffect(() => {
    if (!huntId) return

    const loadStartTime = async () => {
      const supabase = createClient()

      // Get hunt's start_time directly
      const { data, error } = await supabase
        .from('hunts')
        .select('start_time')
        .eq('id', huntId)
        .single<{ start_time: string }>()

      if (error) {
        console.error('Timer: Error loading start_time', error)
        return
      }

      if (data?.start_time) {
        // Parse the datetime string and treat it as Italy local time (ignore UTC indicator)
        // Extract date/time parts: "2026-01-27T04:26:00.000Z" -> treat as "2026-01-27 04:26 Italy"
        const timeStr = data.start_time.substring(0, 19) // Get "2026-01-27T04:26:00"
        const started = new Date(timeStr) // Parse as local time
        const now = new Date()

        const elapsedMs = now.getTime() - started.getTime()
        const elapsed = Math.max(0, Math.floor(elapsedMs / 1000))

        console.log('Timer Debug (Local Time):', {
          startTimeFromDB: data.start_time,
          parsedAsLocal: started.toString(),
          now: now.toString(),
          elapsedMs,
          elapsedSeconds: elapsed,
          elapsedHours: (elapsed / 3600).toFixed(2)
        })

        setStartedAt(started)
        setElapsedTime(elapsed)
        setIsRunning(true)
      }
    }

    loadStartTime()
  }, [huntId])

  // Increment timer every second when running
  useEffect(() => {
    if (!isRunning || !startedAt) return

    const interval = setInterval(() => {
      const now = new Date()
      const elapsedMs = now.getTime() - startedAt.getTime()
      const elapsed = Math.max(0, Math.floor(elapsedMs / 1000))
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, startedAt])

  const startTimer = useCallback(() => {
    const now = new Date()
    setStartedAt(now)
    setElapsedTime(0)
    setIsRunning(true)
  }, [])

  const stopTimer = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setElapsedTime(0)
    setStartedAt(null)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    // Handle negative time (shouldn't happen with Math.max above, but safety check)
    const safeSeconds = Math.max(0, Math.floor(seconds))

    const hours = Math.floor(safeSeconds / 3600)
    const minutes = Math.floor((safeSeconds % 3600) / 60)
    const secs = safeSeconds % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [])

  return {
    elapsedTime,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer,
    formattedTime: formatTime(elapsedTime),
  }
}
