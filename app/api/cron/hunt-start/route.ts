import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { broadcastNotification } from '@/lib/twilio/send-notification'

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Find hunts starting now (within 2 minute window)
    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
    const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000)

    const { data: hunts, error } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .gte('start_time', twoMinutesAgo.toISOString())
      .lte('start_time', twoMinutesFromNow.toISOString())
      .eq('status', 'upcoming') as { data: { id: string; title: string; start_time: string }[] | null; error: any }

    if (error) {
      console.error('Error fetching hunts:', error)
      return NextResponse.json({ error: 'Failed to fetch hunts' }, { status: 500 })
    }

    const results = []

    for (const hunt of hunts || []) {
      const message = `${hunt.title} e' iniziata! Buona fortuna!`

      const result = await broadcastNotification({
        huntId: hunt.id,
        type: 'hunt_started',
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
      huntsProcessed: hunts?.length || 0,
      results,
    })
  } catch (error) {
    console.error('Cron hunt-start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
