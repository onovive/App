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
      .select('title, start_time')
      .eq('id', huntId)
      .single<{ title: string; start_time: string }>()

    if (!hunt) {
      return NextResponse.json(
        { error: 'Hunt not found' },
        { status: 404 }
      )
    }

    const message = `La caccia "${hunt.title}" sta iniziando ORA!\n\nApri l'app e inizia a giocare. Buona fortuna!`

    const result = await broadcastNotification({
      huntId,
      type: 'hunt_starting',
      message,
      userFilter: { huntParticipants: huntId },
    })

    console.log('Hunt starting notification result:', result)

    return NextResponse.json({
      ...result,
      huntTitle: hunt.title,
    })
  } catch (error) {
    console.error('Hunt starting notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
