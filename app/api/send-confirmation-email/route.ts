import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ProfileData {
  email: string
  username: string | null
}

interface HuntData {
  title: string
  start_time: string
  description: string | null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { huntId, userId }: { huntId: string; userId: string } = await request.json()

    if (!huntId || !userId) {
      return NextResponse.json(
        { error: 'Missing huntId or userId' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, username')
      .eq('id', userId)
      .single<ProfileData>()

    // Get hunt details
    const { data: hunt } = await supabase
      .from('hunts')
      .select('title, start_time, description')
      .eq('id', huntId)
      .single<HuntData>()

    if (!profile || !hunt) {
      return NextResponse.json(
        { error: 'User or hunt not found' },
        { status: 404 }
      )
    }

    // Format the start time directly from database string
    const [datePart, timePart] = hunt.start_time.split('T')
    const [year, month, day] = datePart.split('-')
    const [hour, minute] = timePart.split(':')

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const formattedDate = `${monthNames[parseInt(month) - 1]} ${day}, ${year}`
    const formattedTime = `${hour}:${minute}`

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Scavenger Hunt <onboarding@resend.dev>',
      to: [profile.email],
      subject: `You're registered for ${hunt.title}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4CAF50;">Hunt Registration Confirmed!</h1>
          <p>Hi ${profile.username || 'there'},</p>
          <p>You've successfully registered for <strong>${hunt.title}</strong>!</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Hunt Details</h2>
            <p><strong>Start Date:</strong> ${formattedDate}</p>
            <p><strong>Start Time:</strong> ${formattedTime}</p>
            ${hunt.description ? `<p><strong>Description:</strong> ${hunt.description}</p>` : ''}
          </div>

          <p>We'll send you a reminder when the hunt is about to start. Get ready for an exciting adventure!</p>

          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/hunt/${huntId}"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Hunt Details
            </a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't register for this hunt, please ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully:', {
      to: profile.email,
      emailId: data?.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
      emailId: data?.id,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending confirmation email:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
