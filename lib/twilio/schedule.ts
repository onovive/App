import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { formatSMSNumber } from './client'

/**
 * Store a scheduled message in the DB for later sending by cron.
 * No longer uses Twilio's SendAt — messages are sent by the cron job
 * using sendSMSMessage (with alphanumeric sender 'PeriodiQ').
 */
export async function scheduleMessage({
  to,
  body,
  sendAt,
  userId,
  huntId,
  notificationType,
}: {
  to: string
  body: string
  sendAt: Date
  userId: string
  huntId: string
  notificationType: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) {
    return { success: false, error: 'Admin client not configured' }
  }

  try {
    const now = new Date()
    if (sendAt <= now) {
      return { success: false, error: 'sendAt is in the past' }
    }

    const { error } = await (supabase as any).from('scheduled_messages').upsert({
      user_id: userId,
      hunt_id: huntId,
      notification_type: notificationType,
      phone_number: formatSMSNumber(to),
      message_body: body,
      scheduled_for: sendAt.toISOString(),
      status: 'scheduled',
    }, { onConflict: 'user_id,hunt_id,notification_type' })

    if (error) {
      console.error('Failed to store scheduled message:', error)
      return { success: false, error: error.message }
    }

    console.log('Stored scheduled message:', { userId, huntId, notificationType, sendAt: sendAt.toISOString() })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to schedule message:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Cancel a scheduled message by marking it as cancelled in the DB.
 */
export async function cancelScheduledMessageById(id: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return false

  const { error } = await (supabase as any)
    .from('scheduled_messages')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    console.warn('Failed to cancel scheduled message:', id, error.message)
    return false
  }

  console.log('Cancelled scheduled message:', id)
  return true
}

/**
 * Schedule all reminders for a user joining a hunt.
 * Schedules: 60min reminder + hunt starting notification.
 */
export async function scheduleHuntReminders({
  userId,
  huntId,
  phoneNumber,
  huntTitle,
  startTime,
}: {
  userId: string
  huntId: string
  phoneNumber: string
  huntTitle: string
  startTime: Date // UTC
}): Promise<{ scheduled: string[]; skipped: string[]; errors: string[] }> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return { scheduled: [], skipped: [], errors: ['Admin client not configured'] }

  const now = new Date()
  const scheduled: string[] = []
  const skipped: string[] = []
  const errors: string[] = []

  const reminders = [
    {
      type: 'hunt_reminder_60m',
      sendAt: new Date(startTime.getTime() - 60 * 60 * 1000), // 60min before
      message: `${huntTitle} inizia tra 1 ora! Preparati!`,
    },
    {
      type: 'hunt_starting',
      sendAt: startTime, // At start time
      message: `La caccia "${huntTitle}" sta iniziando ORA!\n\nApri l'app e inizia a giocare. Buona fortuna!`,
    },
  ]

  for (const reminder of reminders) {
    // Skip if in the past
    if (reminder.sendAt <= now) {
      skipped.push(`${reminder.type}: in the past`)
      continue
    }

    // Check if already scheduled
    const { data: existing } = await (supabase as any)
      .from('scheduled_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('hunt_id', huntId)
      .eq('notification_type', reminder.type)
      .eq('status', 'scheduled')
      .single()

    if (existing) {
      skipped.push(`${reminder.type}: already scheduled`)
      continue
    }

    const result = await scheduleMessage({
      to: phoneNumber,
      body: reminder.message,
      sendAt: reminder.sendAt,
      userId,
      huntId,
      notificationType: reminder.type,
    })

    if (result.success) {
      scheduled.push(reminder.type)
    } else {
      errors.push(`${reminder.type}: ${result.error}`)
    }
  }

  return { scheduled, skipped, errors }
}

/**
 * Cancel all scheduled reminders for a user leaving a hunt.
 */
export async function cancelHuntReminders({
  userId,
  huntId,
}: {
  userId: string
  huntId: string
}): Promise<{ cancelled: number }> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return { cancelled: 0 }

  const { data: messages } = await (supabase as any)
    .from('scheduled_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('hunt_id', huntId)
    .eq('status', 'scheduled')

  let cancelled = 0
  for (const msg of messages || []) {
    const success = await cancelScheduledMessageById(msg.id)
    if (success) cancelled++
  }

  return { cancelled }
}

/**
 * Cancel and reschedule ALL participants' reminders for a hunt (when time changes).
 */
export async function rescheduleHuntReminders({
  huntId,
  huntTitle,
  newStartTime,
}: {
  huntId: string
  huntTitle: string
  newStartTime: Date
}): Promise<{ cancelled: number; rescheduled: number; errors: string[] }> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return { cancelled: 0, rescheduled: 0, errors: ['Admin client not configured'] }

  // 1. Cancel all existing scheduled messages for this hunt
  const { data: existingMessages } = await (supabase as any)
    .from('scheduled_messages')
    .select('id')
    .eq('hunt_id', huntId)
    .eq('status', 'scheduled')

  let cancelled = 0
  for (const msg of existingMessages || []) {
    const success = await cancelScheduledMessageById(msg.id)
    if (success) cancelled++
  }

  // 2. Get all participants with phone numbers
  const { data: participants } = await supabase
    .from('hunt_participants')
    .select(`
      user_id,
      profiles!inner (
        id,
        phone_number
      )
    `)
    .eq('hunt_id', huntId)

  const errors: string[] = []
  let rescheduled = 0

  for (const p of (participants as any[]) || []) {
    if (!p.profiles?.phone_number) continue

    const result = await scheduleHuntReminders({
      userId: p.profiles.id,
      huntId,
      phoneNumber: p.profiles.phone_number,
      huntTitle,
      startTime: newStartTime,
    })

    rescheduled += result.scheduled.length
    errors.push(...result.errors)

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 50))
  }

  return { cancelled, rescheduled, errors }
}

/**
 * Cancel ALL scheduled messages for a hunt (when hunt is cancelled).
 */
export async function cancelAllHuntMessages(huntId: string): Promise<{ cancelled: number }> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return { cancelled: 0 }

  const { data: messages } = await (supabase as any)
    .from('scheduled_messages')
    .select('id')
    .eq('hunt_id', huntId)
    .eq('status', 'scheduled')

  let cancelled = 0
  for (const msg of messages || []) {
    const success = await cancelScheduledMessageById(msg.id)
    if (success) cancelled++
  }

  return { cancelled }
}
