import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { broadcastNotification } from '@/lib/twilio/send-notification'

// Verify cron secret for security
// function verifyCronSecret(request: NextRequest): boolean {
//   const authHeader = request.headers.get('authorization')
//   const cronSecret = process.env.CRON_SECRET

//   if (!cronSecret) {
//     console.warn('CRON_SECRET not configured')
//     return true // Allow in development
//   }

//   return authHeader === `Bearer ${cronSecret}`
// }

export async function GET(request: NextRequest) {
  // if (!verifyCronSecret(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const supabase = await createServerSupabaseClient()

    // Find hunts starting in approximately 24 hours (23-25 hour window)
    const now = new Date()
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const { data: hunts, error } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .gte('start_time', in23Hours.toISOString())
      .lte('start_time', in25Hours.toISOString())
      .eq('status', 'active') as { data: { id: string; title: string; start_time: string }[] | null; error: any }

    if (error) {
      console.error('Error fetching hunts:', error)
      return NextResponse.json({ error: 'Failed to fetch hunts' }, { status: 500 })
    }

    const results = []

    for (const hunt of hunts || []) {
      const startDate = new Date(hunt.start_time)
      const timeStr = startDate.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const message = `Promemoria: ${hunt.title} inizia domani alle ${timeStr}! Preparati per la caccia al tesoro.`

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
      huntsProcessed: hunts?.length || 0,
      results,
    })
  } catch (error) {
    console.error('Cron reminders-24h error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
