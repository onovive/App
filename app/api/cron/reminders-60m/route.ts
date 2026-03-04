import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { broadcastNotification } from '@/lib/twilio/send-notification'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const now = new Date()

    // Wider window: 45-75 minutes from now (30-min window instead of 10)
    // This ensures the cron (every 5 min) never misses a hunt
    const windowStart = new Date(now.getTime() + 45 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 75 * 60 * 1000)

    console.log('reminders-60m cron running:', {
      now: now.toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    })

    const { data: hunts, error } = await (supabase as any)
      .from('hunts')
      .select('id, title, start_time')
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
      .eq('status', 'upcoming')

    if (error) {
      console.error('Error fetching hunts:', error)
      return NextResponse.json({ error: 'Failed to fetch hunts' }, { status: 500 })
    }

    console.log('reminders-60m found hunts:', hunts?.length || 0, hunts?.map((h: any) => ({ id: h.id, title: h.title, start_time: h.start_time })))

    const results = []

    for (const hunt of hunts || []) {
      // Dedup: check if we already sent a 60m reminder for this hunt
      const { data: existingNotifs } = await (supabase as any)
        .from('notifications')
        .select('id')
        .eq('hunt_id', hunt.id)
        .eq('notification_type', 'hunt_reminder')
        .eq('status', 'sent')
        .limit(1)

      if (existingNotifs && existingNotifs.length > 0) {
        console.log('reminders-60m skipping (already sent):', hunt.title)
        continue
      }

      const startTime = new Date(hunt.start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
      const message = `🏁 *${hunt.title}* inizia tra 1 ora alle ${startTime}!\n\nAssicurati di avere il telefono carico e la fotocamera pronta. Buona fortuna! 🍀`

      const result = await broadcastNotification({
        huntId: hunt.id,
        type: 'hunt_reminder',
        message,
        userFilter: {
          huntParticipants: hunt.id,
        },
      })

      console.log('reminders-60m broadcast result:', { hunt: hunt.title, ...result })

      results.push({
        huntId: hunt.id,
        title: hunt.title,
        ...result,
      })
    }

    return NextResponse.json({
      success: true,
      huntsProcessed: results.length,
      results,
    })
  } catch (error) {
    console.error('Cron reminders-60m error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
