import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { checkVerifyOTP } from '@/lib/twilio/client'
import crypto from 'crypto'

// Generate a deterministic password from phone number
function generatePhonePassword(phone: string): string {
  const secret = process.env.PHONE_AUTH_SECRET || 'periodiq-phone-auth-secret-key'
  return crypto.createHmac('sha256', secret).update(phone).digest('hex').slice(0, 32)
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('+')) {
    cleaned = '+39' + cleaned
  }
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, isSignup } = await request.json()

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Verify OTP using Twilio Verify
    const verifyResult = await checkVerifyOTP(formattedPhone, otp)

    if (!verifyResult.success) {
      console.error('OTP verification failed:', verifyResult)
      return NextResponse.json(
        { error: verifyResult.error || 'Invalid verification code' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Generate phone-based email and password for Supabase auth
    const phoneEmail = `${formattedPhone.replace(/\+/g, '')}@phone.periodiq.app`
    const phonePassword = generatePhonePassword(formattedPhone)

    if (isSignup) {
      // Use admin client to create user with confirmed email
      const adminSupabase = createAdminSupabaseClient()

      if (!adminSupabase) {
        console.error('Admin client not available - SUPABASE_SERVICE_ROLE_KEY not set')
        return NextResponse.json(
          { error: 'Server configuration error. Please contact support.' },
          { status: 500 }
        )
      }

      // Check if user already exists
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === phoneEmail)

      if (existingUser) {
        return NextResponse.json(
          { error: 'This phone number is already registered. Please log in instead.' },
          { status: 400 }
        )
      }

      // Create user with admin API (email is auto-confirmed)
      const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: phoneEmail,
        password: phonePassword,
        email_confirm: true,
        user_metadata: {
          phone_number: formattedPhone,
        }
      })

      if (createError) {
        console.error('Admin create user error:', createError)
        return NextResponse.json(
          { error: 'Failed to create account. Please try again.' },
          { status: 500 }
        )
      }

      // Update profile with phone number
      if (createData.user) {
        const { error: profileError } = await (supabase
          .from('profiles') as any)
          .upsert({
            id: createData.user.id,
            email: phoneEmail,
            phone_number: formattedPhone,
            whatsapp_verified: true,
          })

        if (profileError) {
          console.error('Profile update error:', profileError)
        }
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: phoneEmail,
        password: phonePassword,
      })

      if (signInError) {
        console.error('Sign-in after signup error:', signInError)
        return NextResponse.json({
          success: true,
          message: 'Account created. Please log in.',
          redirectTo: '/login',
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        redirectTo: '/onboarding',
      })
    }

    // Login flow - find user by phone number
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, email, phone_number, whatsapp_verified')
      .eq('phone_number', formattedPhone)
      .single<{ id: string; email: string | null; phone_number: string; whatsapp_verified: boolean | null }>()

    // Fallback: try to find by generated email
    if (!profile) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('id, email, phone_number, whatsapp_verified')
        .eq('email', phoneEmail)
        .single<{ id: string; email: string | null; phone_number: string; whatsapp_verified: boolean | null }>()

      profile = profileByEmail
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'No account found with this phone number. Please sign up first.' },
        { status: 404 }
      )
    }

    // Sign in with phone-based credentials
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: phoneEmail,
      password: phonePassword,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 500 }
      )
    }

    // Update profile
    if (!profile.phone_number) {
      await (supabase
        .from('profiles') as any)
        .update({
          phone_number: formattedPhone,
          whatsapp_verified: true
        })
        .eq('id', profile.id)
    } else if (!profile.whatsapp_verified) {
      await (supabase
        .from('profiles') as any)
        .update({ whatsapp_verified: true })
        .eq('id', profile.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('WhatsApp OTP verify error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
