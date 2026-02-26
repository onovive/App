import { NextRequest, NextResponse } from 'next/server'
import { cancelHuntReminders } from '@/lib/twilio/schedule'

export async function POST(request: NextRequest) {
  try {
    const { huntId, userId } = await request.json()

    if (!huntId || !userId) {
      return NextResponse.json({ error: 'Missing huntId or userId' }, { status: 400 })
    }

    const result = await cancelHuntReminders({ userId, huntId })

    console.log('Cancel reminders result:', { userId, huntId, ...result })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Cancel reminders error:', error)
    return NextResponse.json({ error: 'Failed to cancel reminders' }, { status: 500 })
  }
}
