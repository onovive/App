import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured')
}

export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null

export const TWILIO_WHATSAPP_FROM = whatsappNumber
  ? `whatsapp:${whatsappNumber}`
  : null

export const TWILIO_VERIFY_SERVICE_SID = verifyServiceSid

// Twilio Verify - Send verification code
export async function sendVerifyOTP(
  phoneNumber: string,
  channel: 'whatsapp' | 'sms' = 'whatsapp'
): Promise<{ success: boolean; status?: string; error?: string }> {
  if (!twilioClient || !verifyServiceSid) {
    console.warn('Twilio Verify not configured')
    return { success: false, error: 'Twilio Verify not configured' }
  }

  try {
    // Format phone number
    let formatted = phoneNumber.replace(/[^\d+]/g, '')
    if (!formatted.startsWith('+')) {
      formatted = '+39' + formatted
    }

    console.log('Sending Verify OTP:', { to: formatted, channel })

    const verification = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formatted,
        channel: channel,
      })

    console.log('Verify OTP sent:', { status: verification.status, sid: verification.sid })

    return { success: true, status: verification.status }
  } catch (error: any) {
    console.error('Twilio Verify send error:', {
      message: error.message,
      code: error.code,
    })
    return { success: false, error: error.message }
  }
}

// Twilio Verify - Check verification code
export async function checkVerifyOTP(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  if (!twilioClient || !verifyServiceSid) {
    console.warn('Twilio Verify not configured')
    return { success: false, error: 'Twilio Verify not configured' }
  }

  try {
    // Format phone number
    let formatted = phoneNumber.replace(/[^\d+]/g, '')
    if (!formatted.startsWith('+')) {
      formatted = '+39' + formatted
    }

    console.log('Checking Verify OTP:', { to: formatted, code })

    const verificationCheck = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formatted,
        code: code,
      })

    console.log('Verify OTP check:', { status: verificationCheck.status })

    if (verificationCheck.status === 'approved') {
      return { success: true, status: 'approved' }
    } else {
      return { success: false, status: verificationCheck.status, error: 'Invalid code' }
    }
  } catch (error: any) {
    console.error('Twilio Verify check error:', {
      message: error.message,
      code: error.code,
    })
    return { success: false, error: error.message }
  }
}

export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove any non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '')

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Italian number if no country code
    cleaned = '+39' + cleaned
  }

  // Normalize the number (remove any double + or spaces)
  cleaned = '+' + cleaned.replace(/\+/g, '')

  return `whatsapp:${cleaned}`
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!twilioClient || !TWILIO_WHATSAPP_FROM) {
    console.warn('Twilio not configured - message not sent:', { to, body })
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    console.log('Sending WhatsApp message:', {
      from: TWILIO_WHATSAPP_FROM,
      to: formatWhatsAppNumber(to),
      bodyLength: body.length,
    })

    const message = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: formatWhatsAppNumber(to),
      body,
    })

    console.log('WhatsApp message sent:', {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    })

    return { success: true, sid: message.sid }
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', {
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function formatSMSNumber(phoneNumber: string): string {
  // Remove any non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '')

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Italian number if no country code
    cleaned = '+39' + cleaned
  }

  // Normalize the number (remove any double + or spaces)
  cleaned = '+' + cleaned.replace(/\+/g, '')

  return cleaned
}

export async function sendSMSMessage(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!twilioClient) {
    console.warn('Twilio not configured - SMS not sent:', { to, body })
    return { success: false, error: 'Twilio not configured' }
  }

  const smsFromNumber = process.env.TWILIO_SMS_NUMBER
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!smsFromNumber && !messagingServiceSid) {
    console.warn('No SMS sender configured - need TWILIO_SMS_NUMBER or TWILIO_MESSAGING_SERVICE_SID')
    return { success: false, error: 'SMS sender not configured' }
  }

  try {
    const formattedTo = formatSMSNumber(to)
    console.log('Sending SMS:', {
      to: formattedTo,
      from: smsFromNumber || 'messaging service',
      bodyLength: body.length,
    })

    const messageParams: any = {
      to: formattedTo,
      body,
    }

    // Use phone number if available, otherwise use messaging service
    if (smsFromNumber) {
      messageParams.from = smsFromNumber
    } else {
      messageParams.messagingServiceSid = messagingServiceSid
    }

    const message = await twilioClient.messages.create(messageParams)

    console.log('SMS sent:', {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    })

    return { success: true, sid: message.sid }
  } catch (error: any) {
    console.error('Failed to send SMS:', {
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
