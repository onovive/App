import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendSMSMessage } from '@/lib/twilio/client'

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const now = new Date().toISOString()

    // Get all scheduled messages that are due
    const { data: dueMessages, error } = await (supabase as any)
      .from('scheduled_messages')
      .select('id, user_id, hunt_id, notification_type, phone_number, message_body, scheduled_for')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .not('phone_number', 'is', null)
      .not('message_body', 'is', null)

    if (error) {
      console.error('Failed to fetch due messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const msg of dueMessages || []) {
      const result = await sendSMSMessage(msg.phone_number, msg.message_body)

      if (result.success) {
        await (supabase as any)
          .from('scheduled_messages')
          .update({
            status: 'sent',
            twilio_message_sid: result.sid || null,
          })
          .eq('id', msg.id)
        sent++
      } else {
        await (supabase as any)
          .from('scheduled_messages')
          .update({ status: 'failed' })
          .eq('id', msg.id)
        failed++
        errors.push(`${msg.id}: ${result.error}`)
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log('Send scheduled messages result:', { due: dueMessages?.length || 0, sent, failed })

    return NextResponse.json({
      success: true,
      due: dueMessages?.length || 0,
      sent,
      failed,
      errors,
    })
  } catch (error) {
    console.error('Cron send-scheduled-messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
