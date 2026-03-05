import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { broadcastNotification } from '@/lib/twilio/send-notification'

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Find completed hunts that haven't had results notifications sent yet
    const { data: hunts, error } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .eq('status', 'completed') as { data: { id: string; title: string; start_time: string }[] | null; error: any }

    if (error) {
      console.error('Error fetching hunts:', error)
      return NextResponse.json({ error: 'Failed to fetch hunts' }, { status: 500 })
    }

    const results = []

    for (const hunt of hunts || []) {
      // Dedup: check if we already sent a results notification for this hunt
      const { data: existingNotifs } = await (supabase as any)
        .from('notifications')
        .select('id')
        .eq('hunt_id', hunt.id)
        .eq('notification_type', 'hunt_completed')
        .eq('status', 'sent')
        .limit(1)

      if (existingNotifs && existingNotifs.length > 0) continue

      const message = `La caccia ${hunt.title} e terminata.\n\nLa classifica e ora disponibile.\n\nhttps://app.periodiq.co`

      const result = await broadcastNotification({
        huntId: hunt.id,
        type: 'hunt_completed',
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
    console.error('Cron results-published error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
