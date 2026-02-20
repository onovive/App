import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExplorerTypeSelector from '@/components/profile/ExplorerTypeSelector'
import WhatsAppVerification from '@/components/profile/WhatsAppVerification'
import SignOutButton from '@/components/SignOutButton'
import { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  phone_number?: string | null
  whatsapp_verified?: boolean
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) {
    redirect('/onboarding')
  }

  // Statistics code removed - will be added back in next release

  return (
    <div className="min-h-screen flex justify-center bg-[#ECECEC]">
      <div className="w-full max-w-[400px] bg-white border border-[#D0D0D0] min-h-screen pb-5 box-border overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="bg-[#EFEFEF] border-b border-[#C0C0C0] px-5 py-[15px] flex items-center sticky top-0 z-10">
          <Link
            href="/dashboard"
            className="text-2xl cursor-pointer mr-[15px] text-[#444444] font-bold"
          >
            &#x276E;
          </Link>
          <div className="text-lg font-bold text-[#444444]">Il Tuo Profilo</div>
        </div>

        {/* Profile Section */}
        <div className="px-5 py-5">
          {/* Avatar & Username */}
          <div className="flex flex-col items-center mb-[30px] pb-[20px] border-b border-[#EFEFEF]">
            <div className="relative mb-4">
              <div className="w-[120px] h-[120px] rounded-full bg-[#00BCD4] border-4 border-white shadow-[0_0_0_2px_#A0A0A0] overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || 'User'}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {profile.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <Link
                href="/profile/edit-avatar"
                className="absolute bottom-0 right-0 w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-gray-500 transition-colors"
                title="Change profile picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </Link>
            </div>

            <div className="text-2xl font-bold text-[#333]">
              {profile.username}
            </div>
          </div>

          {/* Explorer Type */}
          <div className="mb-[30px] pb-[20px] border-b border-[#EFEFEF]">
            <h3 className="text-base font-bold mb-[15px] text-[#333]">
              Tipo di Esploratore
            </h3>
            <ExplorerTypeSelector
              userId={user.id}
              currentType={profile.explorer_type}
            />
          </div>

          {/* WhatsApp Notifications */}
          <div className="mb-[30px] pb-[20px] border-b border-[#EFEFEF]">
            <WhatsAppVerification
              userId={user.id}
              currentPhoneNumber={profile.phone_number || null}
              isVerified={profile.whatsapp_verified || false}
            />
          </div>

          {/* Statistics - Hidden for next release */}
          {/*
          <div className="mb-[30px]">
            <h3 className="text-base font-bold mb-[15px] text-[#333] border-b border-dashed border-[#E0E0E0] pb-2">
              Le Tue Statistiche
            </h3>
            ... stats content ...
          </div>
          */}

          {/* Recent Activity - Hidden for next release */}
          {/*
          {participations && participations.length > 0 && (
            <div className="mb-5">
              <h3 className="text-base font-bold mb-[15px] text-[#333] border-b border-dashed border-[#E0E0E0] pb-2">
                Attività Recente
              </h3>
              ... activity content ...
            </div>
          )}
          */}

          {/* Sign Out Button */}
          <div className="mt-8 pt-5  ">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  )
}
