import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { broadcastNotification } from '@/lib/twilio/send-notification'

export async function POST(request: NextRequest) {
  try {
    const { huntId } = await request.json()

    if (!huntId) {
      return NextResponse.json(
        { error: 'Missing huntId' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get hunt details
    const { data: hunt } = await supabase
      .from('hunts')
      .select('title')
      .eq('id', huntId)
      .single<{ title: string }>()

    if (!hunt) {
      return NextResponse.json(
        { error: 'Hunt not found' },
        { status: 404 }
      )
    }

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
      .eq('hunt_id', huntId)
      .not('completed_at', 'is', null)
      .order('total_time_seconds', { ascending: true })
      .limit(1)
      .single()

    const winnerName = (winner as any)?.profiles?.username || 'Unknown'

    const message = `Classifica disponibile per "${hunt.title}"!\n\nIl vincitore e' ${winnerName}!\n\nGuarda i risultati nell'app.`

    const result = await broadcastNotification({
      huntId,
      type: 'hunt_completed',
      message,
      userFilter: { huntParticipants: huntId },
    })

    console.log('Results published notification result:', result)

    return NextResponse.json({
      ...result,
      huntTitle: hunt.title,
      winner: winnerName,
    })
  } catch (error) {
    console.error('Results published notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
