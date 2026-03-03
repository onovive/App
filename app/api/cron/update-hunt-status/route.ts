import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { broadcastNotification } from '@/lib/twilio/send-notification'

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }
    const now = new Date()
    const results = {
      activatedHunts: [] as string[],
      completedHunts: [] as string[],
      notifications: [] as any[],
    }

    // 1. Find "upcoming" hunts whose start_time has passed → change to "active"
    const { data: upcomingHunts } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .eq('status', 'upcoming')
      .lte('start_time', now.toISOString()) as { data: { id: string; title: string; start_time: string }[] | null }

    for (const hunt of upcomingHunts || []) {
      // Update status to active
      const { error } = await (supabase as any)
        .from('hunts')
        .update({ status: 'active' })
        .eq('id', hunt.id)

      if (!error) {
        results.activatedHunts.push(hunt.title)

        // Dedup: only send if not already sent by hunt-start cron
        const { data: existingStartNotifs } = await (supabase as any)
          .from('notifications')
          .select('id')
          .eq('hunt_id', hunt.id)
          .in('notification_type', ['hunt_starting', 'hunt_started'])
          .eq('status', 'sent')
          .limit(1)

        if (!existingStartNotifs || existingStartNotifs.length === 0) {
          const message = `La caccia "${hunt.title}" sta iniziando ORA!\n\nApri l'app e inizia a giocare. Buona fortuna!`

          const notifResult = await broadcastNotification({
            huntId: hunt.id,
            type: 'hunt_starting',
            message,
            userFilter: { huntParticipants: hunt.id },
          })

          results.notifications.push({
            hunt: hunt.title,
            type: 'hunt_starting',
            ...notifResult,
          })
        }
      }
    }

    // 2. Find "active" hunts that started 24+ hours ago → change to "completed"
    const hours24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const { data: activeHunts } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .eq('status', 'active')
      .lte('start_time', hours24Ago.toISOString()) as { data: { id: string; title: string; start_time: string }[] | null }

    for (const hunt of activeHunts || []) {
      // Update status to completed
      const { error } = await (supabase as any)
        .from('hunts')
        .update({ status: 'completed' })
        .eq('id', hunt.id)

      if (!error) {
        results.completedHunts.push(hunt.title)

        // Dedup: only send if not already sent by results-published cron
        const { data: existingCompletedNotifs } = await (supabase as any)
          .from('notifications')
          .select('id')
          .eq('hunt_id', hunt.id)
          .eq('notification_type', 'hunt_completed')
          .eq('status', 'sent')
          .limit(1)

        if (!existingCompletedNotifs || existingCompletedNotifs.length === 0) {
          // Get winner
          const { data: winners } = await supabase
            .from('hunt_participants')
            .select(`
              user_id,
              total_time_seconds,
              profiles!inner (
                username
              )
            `)
            .eq('hunt_id', hunt.id)
            .not('completed_at', 'is', null)
            .order('total_time_seconds', { ascending: true })
            .limit(1)

          const winnerName = (winners && winners.length > 0) ? (winners[0] as any)?.profiles?.username || 'Unknown' : 'Unknown'

          const message = `Classifica disponibile per "${hunt.title}"!\n\nIl vincitore e' ${winnerName}!\n\nGuarda i risultati nell'app.`

          const notifResult = await broadcastNotification({
            huntId: hunt.id,
            type: 'hunt_completed',
            message,
            userFilter: { huntParticipants: hunt.id },
          })

          results.notifications.push({
            hunt: hunt.title,
            type: 'results_published',
            winner: winnerName,
            ...notifResult,
          })
        }
      }
    }

    console.log('Hunt status update results:', results)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Cron update-hunt-status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
