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
    const dateStr = startDate.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const timeStr = startDate.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const message = `Nuova Caccia al Tesoro: ${hunt.title}!\n\nInizio: ${dateStr} alle ${timeStr}\n\nIscriviti subito nell'app per partecipare!`

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
