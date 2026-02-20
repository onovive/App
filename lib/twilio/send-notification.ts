import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendSMSMessage } from './client'

export type NotificationType =
  | 'hunt_reminder'
  | 'hunt_starting'
  | 'hunt_started'
  | 'hunt_completed'
  | 'subscription_update'

interface SendNotificationParams {
  userId: string
  huntId?: string
  type: NotificationType
  message: string
  phoneNumber: string
}

export async function sendNotification({
  userId,
  huntId,
  type,
  message,
  phoneNumber,
}: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  // Send SMS
  const smsResult = await sendSMSMessage(phoneNumber, message)

  // Log notification to database
  const { error: dbError } = await (supabase as any)
    .from('notifications')
    .insert({
      user_id: userId,
      hunt_id: huntId || null,
      notification_type: type,
      channel: 'sms',
      status: smsResult.success ? 'sent' : 'failed',
      message_content: message,
      twilio_sid: smsResult.sid || null,
      error_message: smsResult.error || null,
      scheduled_for: new Date().toISOString(),
      sent_at: smsResult.success ? new Date().toISOString() : null,
    })

  if (dbError) {
    console.error('Failed to log notification:', dbError)
  }

  if (!smsResult.success) {
    console.error('SMS send failed:', { userId, type, error: smsResult.error })
    return { success: false, error: smsResult.error }
  }

  return { success: true }
}

interface BroadcastNotificationParams {
  huntId?: string
  type: NotificationType
  message: string
  userFilter?: {
    withPhoneNumber?: boolean
    huntParticipants?: string // hunt_id to get participants
  }
}

export async function broadcastNotification({
  huntId,
  type,
  message,
  userFilter,
}: BroadcastNotificationParams): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const supabase = await createServerSupabaseClient()

  let users: { id: string; phone_number: string }[] = []

  if (userFilter?.huntParticipants) {
    // Get participants of a specific hunt with phone numbers
    const { data } = await supabase
      .from('hunt_participants')
      .select(`
        user_id,
        profiles!inner (
          id,
          phone_number
        )
      `)
      .eq('hunt_id', userFilter.huntParticipants)

    users = ((data as any[]) || [])
      .filter((p: any) => p.profiles?.phone_number)
      .map((p: any) => ({
        id: p.profiles.id,
        phone_number: p.profiles.phone_number,
      }))
  } else if (userFilter?.withPhoneNumber) {
    // Get all users with phone numbers
    const { data } = await supabase
      .from('profiles')
      .select('id, phone_number')
      .not('phone_number', 'is', null)

    users = (data || []) as { id: string; phone_number: string }[]
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const user of users) {
    const result = await sendNotification({
      userId: user.id,
      huntId,
      type,
      message,
      phoneNumber: user.phone_number,
    })

    if (result.success) {
      sent++
    } else {
      failed++
      if (result.error) {
        errors.push(`${user.id}: ${result.error}`)
      }
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { sent, failed, errors }
}
