import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user profile to check onboarding status
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, role')
          .eq('id', user.id)
          .single()

        // Check if user is admin
        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`)
        }

        // Redirect to onboarding if not completed, otherwise dashboard
        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
