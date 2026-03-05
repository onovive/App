import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
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

    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

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

    const message = `La caccia ${hunt.title} e terminata.\n\nLa classifica e ora disponibile.\n\nhttps://app.periodiq.co`

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
    })
  } catch (error) {
    console.error('Results published notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
