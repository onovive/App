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

    // Find hunts starting in approximately 60 minutes (55-65 minute window)
    const now = new Date()
    const in55Minutes = new Date(now.getTime() + 55 * 60 * 1000)
    const in65Minutes = new Date(now.getTime() + 65 * 60 * 1000)

    const { data: hunts, error } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .gte('start_time', in55Minutes.toISOString())
      .lte('start_time', in65Minutes.toISOString())
      .eq('status', 'active') as { data: { id: string; title: string; start_time: string }[] | null; error: any }

    if (error) {
      console.error('Error fetching hunts:', error)
      return NextResponse.json({ error: 'Failed to fetch hunts' }, { status: 500 })
    }

    const results = []

    for (const hunt of hunts || []) {
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
      huntsProcessed: hunts?.length || 0,
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
