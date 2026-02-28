import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { broadcastNotification } from '@/lib/twilio/send-notification'

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Find hunts starting in approximately 60 minutes (55-65 minute window)
    const now = new Date()
    const in55Minutes = new Date(now.getTime() + 55 * 60 * 1000)
    const in65Minutes = new Date(now.getTime() + 65 * 60 * 1000)

    const { data: hunts, error } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .gte('start_time', in55Minutes.toISOString())
      .lte('start_time', in65Minutes.toISOString())
      .eq('status', 'upcoming') as { data: { id: string; title: string; start_time: string }[] | null; error: any }

    if (error) {
      console.error('Error fetching hunts:', error)
      return NextResponse.json({ error: 'Failed to fetch hunts' }, { status: 500 })
    }

    const results = []

    for (const hunt of hunts || []) {
      // Dedup: check if we already sent a 60m reminder for this hunt
      const { data: alreadySent } = await (supabase as any)
        .from('notifications')
        .select('id')
        .eq('hunt_id', hunt.id)
        .eq('notification_type', 'hunt_reminder')
        .eq('status', 'sent')
        .limit(1)
        .single()

      if (alreadySent) continue

      const message = `${hunt.title} inizia tra 1 ora! Preparati!`

      const result = await broadcastNotification({
        huntId: hunt.id,
        type: 'hunt_reminder',
        message,
        userFilter: {
          huntParticipants: hunt.id,
        },
      })

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
