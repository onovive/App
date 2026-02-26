import { NextRequest, NextResponse } from 'next/server'
import { rescheduleHuntReminders, cancelAllHuntMessages } from '@/lib/twilio/schedule'

export async function POST(request: NextRequest) {
  try {
    const { huntId, huntTitle, newStartTime, cancelOnly } = await request.json()

    if (!huntId) {
      return NextResponse.json({ error: 'Missing huntId' }, { status: 400 })
    }

    // If hunt is cancelled, just cancel all messages
    if (cancelOnly) {
      const result = await cancelAllHuntMessages(huntId)
      console.log('Cancel all hunt messages result:', { huntId, ...result })
      return NextResponse.json({ success: true, ...result })
    }

    if (!huntTitle || !newStartTime) {
      return NextResponse.json({ error: 'Missing huntTitle or newStartTime' }, { status: 400 })
    }

    const result = await rescheduleHuntReminders({
      huntId,
      huntTitle,
      newStartTime: new Date(newStartTime),
    })

    console.log('Reschedule hunt result:', { huntId, ...result })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Reschedule hunt error:', error)
    return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 })
  }
}
