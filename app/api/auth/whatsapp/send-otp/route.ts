import { NextRequest, NextResponse } from 'next/server'
import { sendVerifyOTP } from '@/lib/twilio/client'

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Italian number if no country code
    cleaned = '+39' + cleaned
  }

  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Validate phone number format (basic validation)
    if (formattedPhone.length < 10 || formattedPhone.length > 15) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Send OTP via Twilio Verify using SMS
    const result = await sendVerifyOTP(formattedPhone, 'sms')

    if (!result.success) {
      console.error('Failed to send verification code:', result.error)
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      phoneNumber: formattedPhone,
    })
  } catch (error) {
    console.error('WhatsApp OTP send error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
