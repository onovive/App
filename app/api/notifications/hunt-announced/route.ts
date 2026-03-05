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
      .select('title, start_time, description')
      .eq('id', huntId)
      .single<{ title: string; start_time: string; description: string | null }>()

    if (!hunt) {
      return NextResponse.json(
        { error: 'Hunt not found' },
        { status: 404 }
      )
    }

    const startDate = new Date(hunt.start_time)
    const day = startDate.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Rome',
    })
    const timeStr = startDate.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome',
    })

    const message = `Nuova caccia al tesoro: ${hunt.title}.\n\nInizio: ${day} alle ${timeStr}.\n\nIscriviti ora:\nhttps://app.periodiq.co`

    // Broadcast to all users with phone numbers
    const result = await broadcastNotification({
      huntId,
      type: 'subscription_update',
      message,
      userFilter: { withPhoneNumber: true },
    })

    return NextResponse.json({
      ...result,
      huntTitle: hunt.title,
    })
  } catch (error) {
    console.error('Hunt announced notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
