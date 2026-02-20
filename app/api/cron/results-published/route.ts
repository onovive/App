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

    // Find hunts that started approximately 24 hours ago (23-25 hour window)
    // Rankings become available after 24 hours
    const now = new Date()
    const hours23Ago = new Date(now.getTime() - 25 * 60 * 60 * 1000)
    const hours25Ago = new Date(now.getTime() - 23 * 60 * 60 * 1000)

    const { data: hunts, error } = await supabase
      .from('hunts')
      .select('id, title, start_time')
      .gte('start_time', hours23Ago.toISOString())
      .lte('start_time', hours25Ago.toISOString())
      .eq('status', 'active') as { data: { id: string; title: string; start_time: string }[] | null; error: any }

    if (error) {
      console.error('Error fetching hunts:', error)
      return NextResponse.json({ error: 'Failed to fetch hunts' }, { status: 500 })
    }

    const results = []

    for (const hunt of hunts || []) {
      // Get the winner (participant with lowest total_time_seconds who completed)
      const { data: winner } = await supabase
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
        .single()

      const winnerName = (winner as any)?.profiles?.username || 'Unknown'

      const message = `Classifica disponibile per ${hunt.title}! Il vincitore e' ${winnerName}! Guarda i risultati nell'app.`

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
        winner: winnerName,
        ...result,
      })
    }

    return NextResponse.json({
      success: true,
      huntsProcessed: hunts?.length || 0,
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
