import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', user.id)
    .single<Pick<Profile, 'user_role'>>()

  if (profile?.user_role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="py-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
