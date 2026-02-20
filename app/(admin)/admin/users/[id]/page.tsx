import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EditUserForm from '@/components/admin/EditUserForm'
import { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Check if current user is admin
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', currentUser.id)
    .single<{ user_role: string | null }>()

  if (currentProfile?.user_role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch user to edit
  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single<Profile>()

  if (!user) {
    redirect('/admin/users')
  }

  return (
    <div className="min-h-screen flex justify-center bg-[#ECECEC]">
      <div className="w-full max-w-[800px] bg-white border border-[#D0D0D0] min-h-screen pb-5 box-border overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="bg-[#EFEFEF] border-b border-[#C0C0C0] px-5 py-[15px] flex items-center sticky top-0 z-10">
          <Link
            href="/admin/users"
            className="text-2xl cursor-pointer mr-[15px] text-[#444444] font-bold"
          >
            &#x276E;
          </Link>
          <div className="text-lg font-bold text-[#444444]">
            Edit User: {user.username || user.email}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {/* User Info Section */}
          <div className="mb-6 pb-6 border-b border-[#EFEFEF]">
            <h2 className="text-base font-bold mb-4 text-[#333]">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200 font-mono text-xs break-all">
                  {user.id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {user.created_at.replace('T', ' ').substring(0, 19)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Status</label>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {user.onboarding_completed ? (
                    <span className="text-green-600 font-medium">✓ Completed</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="mb-6 pb-6 border-b border-[#EFEFEF]">
            <h2 className="text-base font-bold mb-4 text-[#333]">Profile Picture</h2>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#00BCD4] border-4 border-white shadow-[0_0_0_2px_#A0A0A0] overflow-hidden flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {user.avatar_url ? (
                  <div className="break-all">{user.avatar_url}</div>
                ) : (
                  <div>No avatar uploaded</div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <EditUserForm user={user} />
        </div>
      </div>
    </div>
  )
}
