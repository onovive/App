import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  // Otherwise redirect to login
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
