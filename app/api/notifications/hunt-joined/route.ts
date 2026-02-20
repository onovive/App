import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/twilio/send-notification'

export async function POST(request: NextRequest) {
  try {
    let huntId: string | undefined
    let userId: string | undefined

    try {
      const body = await request.json()
      huntId = body.huntId
      userId = body.userId
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!huntId || !userId) {
      return NextResponse.json(
        { error: 'Missing huntId or userId' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get user profile with phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number, whatsapp_verified')
      .eq('id', userId)
      .single<{ phone_number: string | null; whatsapp_verified: boolean | null }>()

    console.log('Hunt joined notification - profile lookup:', { userId, profile, profileError })

    if (!profile?.phone_number) {
      console.log('Skipping notification - phone not configured:', {
        phone_number: profile?.phone_number,
      })
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Phone not configured',
      })
    }

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

    const message = `Sei iscritto a: ${hunt.title}!\n\nLa caccia iniziera' ${dateStr} alle ${timeStr}.\n\nTi avviseremo prima dell'inizio. Buona fortuna!`

    console.log('Sending hunt joined notification:', { userId, huntId, phoneNumber: profile.phone_number })

    const result = await sendNotification({
      userId,
      huntId,
      type: 'subscription_update',
      message,
      phoneNumber: profile.phone_number,
    })

    console.log('Hunt joined notification result:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Hunt joined notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
