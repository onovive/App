import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { scheduleHuntReminders } from '@/lib/twilio/schedule'

export async function POST(request: NextRequest) {
  try {
    const { huntId, userId } = await request.json()

    if (!huntId || !userId) {
      return NextResponse.json({ error: 'Missing huntId or userId' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Get user phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', userId)
      .single<{ phone_number: string | null }>()

    if (!profile?.phone_number) {
      return NextResponse.json({ success: true, skipped: true, reason: 'No phone number' })
    }

    // Get hunt details
    const { data: hunt } = await supabase
      .from('hunts')
      .select('title, start_time')
      .eq('id', huntId)
      .single<{ title: string; start_time: string }>()

    if (!hunt) {
      return NextResponse.json({ error: 'Hunt not found' }, { status: 404 })
    }

    const result = await scheduleHuntReminders({
      userId,
      huntId,
      phoneNumber: profile.phone_number,
      huntTitle: hunt.title,
      startTime: new Date(hunt.start_time),
    })

    console.log('Schedule reminders result:', { userId, huntId, ...result })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Schedule reminders error:', error)
    return NextResponse.json({ error: 'Failed to schedule reminders' }, { status: 500 })
  }
}
