'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full bg-[#DC3545] text-white px-4 py-3 rounded-lg border-2 border-[#C82333] font-semibold hover:bg-[#C82333] transition-colors"
    >
      Disconnetti
    </button>
  )
}
