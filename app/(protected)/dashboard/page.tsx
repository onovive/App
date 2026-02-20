import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Database } from '@/lib/types/database'

// Revalidate every 60 seconds for better performance
export const revalidate = 60

type Profile = Database['public']['Tables']['profiles']['Row']

interface Hunt {
  id: string
  title: string
  description: string | null
  start_time: string
  duration_minutes: number
  cover_image_url: string | null
  clues_count: number
  prizes: Record<string, string> | null
  status: string
  created_at: string
  updated_at: string | null
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch data in parallel for better performance
  const [profileResult, huntsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single<Pick<Profile, 'username' | 'avatar_url'>>(),
    supabase
      .from('hunts')
      .select('id, title, description, start_time, duration_minutes, cover_image_url, clues_count, prizes, status, created_at')
      .in('status', ['upcoming', 'active', 'completed'])
      .order('start_time', { ascending: true })
  ])

  const profile = profileResult.data
  const allHunts = huntsResult.data as Hunt[] | null

  // Separate hunts by their actual database status
  const activeHunts = allHunts?.filter((hunt) => hunt.status === 'active') || []
  const upcomingHunts = allHunts?.filter((hunt) => hunt.status === 'upcoming') || []

  // Show all completed hunts (not just ones user participated in)
  const pastHunts = allHunts?.filter((hunt) => {
    return hunt.status === 'completed'
  }).reverse() || []

  const formatStartTime = (startTime: string) => {
    const [datePart, timePart] = startTime.split('T')
    const [, month, day] = datePart.split('-')
    const [hour, minute] = timePart.split(':')
    const monthNames = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC']
    const monthName = monthNames[parseInt(month) - 1]
    return `${day} ${monthName}, ${hour}:${minute}`
  }

  const formatRelativeTime = (completedDate: string) => {
    const now = Date.now()
    const completed = new Date(completedDate).getTime()
    const diffInDays = Math.floor((now - completed) / (1000 * 60 * 60 * 24))

    if (diffInDays < 30) {
      return `${diffInDays} giorni fa`
    } else if (diffInDays < 60) {
      return '1 mese fa'
    } else {
      const months = Math.floor(diffInDays / 30)
      return `${months} mesi fa`
    }
  }

  return (
    <div className="min-h-screen flex justify-center bg-[#ECECEC]">
      <div className="w-full max-w-[400px] bg-white border border-[#D0D0D0] min-h-screen pb-5 box-border overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="bg-[#EFEFEF] border-b border-[#C0C0C0] px-5 py-[15px] flex justify-between items-center sticky top-0 z-10">
          <img src="/LOGO.svg" alt="PeriodiQ" className="h-8" />
          <Link
            href="/profile"
            className="w-[35px] h-[35px] bg-[#00BCD4] rounded-full border-2 border-white shadow-[0_0_0_1px_#A0A0A0] cursor-pointer overflow-hidden"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {/* Attive Hunts */}
          {activeHunts && activeHunts.length > 0 && (
            <>
              <h2 className="text-base font-semibold mt-[15px] mb-[10px] pb-[5px] border-b border-[#EFEFEF]">
                Attive ({activeHunts.length})
              </h2>
              {activeHunts.map((hunt) => (
                <Link
                  key={hunt.id}
                  href={`/hunt/${hunt.id}`}
                  className="block border border-[#4CAF50] mb-[15px] bg-[#F0FFF0] flex items-stretch transition-shadow hover:shadow-[0_2px_5px_rgba(76,175,80,0.3)] cursor-pointer"
                >
                  {/* Hunt Image - Square */}
                  <div className="w-[150px] h-[170px] flex-shrink-0 bg-[#D0D0D0] flex items-center justify-center overflow-hidden border-r border-[#4CAF50]">
                    {hunt.cover_image_url ? (
                      <img
                        src={hunt.cover_image_url}
                        alt={hunt.title}
                        className="w-full h-full "
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Hunt Details */}
                  <div className="px-[10px] py-[10px] flex-grow">
                    <div className="text-base font-bold mb-[5px] leading-[1.2] flex items-center gap-2">
                      
                      {hunt.title}
                    </div>

                    <div className="text-xs text-[#666] mt-[5px]">
                      Indizi: {hunt.clues_count}
                    </div>

                    {/* Prizes */}
                    {hunt.prizes && (
                      <div className="mt-2 pt-[5px] border-t border-dashed border-[#E0E0E0] space-y-1">
                        {(hunt.prizes as any)?.first && (
                          <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                            <span className="inline-block bg-[#FFD700] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                              1°
                            </span>
                            <span className="text-[#333] font-bold">
                              {(hunt.prizes as any).first}
                            </span>
                          </div>
                        )}
                        {(hunt.prizes as any)?.second && (
                          <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                            <span className="inline-block bg-[#C0C0C0] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                              2°
                            </span>
                            <span className="text-[#333] font-bold">
                              {(hunt.prizes as any).second}
                            </span>
                          </div>
                        )}
                        {(hunt.prizes as any)?.third && (
                          <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                            <span className="inline-block bg-[#CD7F32] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                              3°
                            </span>
                            <span className="text-[#333] font-bold">
                              {(hunt.prizes as any).third}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </>
          )}

          {/* Future Hunts */}
          <h2 className="text-base font-semibold mt-[15px] mb-[10px] pb-[5px] border-b border-[#EFEFEF]">
            Future ({upcomingHunts?.length || 0})
          </h2>

          {upcomingHunts && upcomingHunts.length > 0 ? (
            upcomingHunts.map((hunt) => (
              <Link
                key={hunt.id}
                href={`/hunt/${hunt.id}`}
                className="block border border-[#C0C0C0] mb-[15px] bg-white flex items-stretch transition-shadow hover:shadow-[0_2px_5px_rgba(0,0,0,0.1)] cursor-pointer"
              >
                {/* Hunt Image - Square */}
                <div className="w-[150px] h-[170px] flex-shrink-0 bg-[#D0D0D0] flex items-center justify-center overflow-hidden border-r border-[#C0C0C0]">
                  {hunt.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hunt.cover_image_url}
                      alt={hunt.title}
                      className="w-full h-full "
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Hunt Details */}
                <div className="px-[10px] py-[10px] flex-grow">
                  <div className="text-base font-bold mb-[5px] leading-[1.2]">
                    {hunt.title}
                  </div>

                  <div className="text-xs text-[#666] mt-[5px]">
                    Inizio:{' '}
                    <span className="text-[#CC0000] font-bold">
                      {formatStartTime(hunt.start_time)}
                    </span>
                  </div>
                  <div className="text-xs text-[#666] mt-[5px]">
                    Indizi: {hunt.clues_count}
                  </div>

                  {/* Prizes */}
                  {hunt.prizes && (
                    <div className="mt-2 pt-[5px] border-t border-dashed border-[#E0E0E0] space-y-1">
                      {(hunt.prizes as any)?.first && (
                        <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                          <span className="inline-block bg-[#FFD700] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                            1°
                          </span>
                          <span className="text-[#333] font-bold">
                            {(hunt.prizes as any).first}
                          </span>
                        </div>
                      )}
                      {(hunt.prizes as any)?.second && (
                        <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                          <span className="inline-block bg-[#C0C0C0] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                            2°
                          </span>
                          <span className="text-[#333] font-bold">
                            {(hunt.prizes as any).second}
                          </span>
                        </div>
                      )}
                      {(hunt.prizes as any)?.third && (
                        <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                          <span className="inline-block bg-[#CD7F32] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                            3°
                          </span>
                          <span className="text-[#333] font-bold">
                            {(hunt.prizes as any).third}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="text-gray-500 text-sm py-4">
              No upcoming hunts at the moment.
            </div>
          )}

          {/* Passate Hunts */}
          <h2 className="text-base font-semibold mt-[30px] mb-[10px] pb-[5px] border-b border-[#EFEFEF]">
            Passate ({pastHunts?.length || 0})
          </h2>

          {pastHunts && pastHunts.length > 0 ? (
            pastHunts.map((hunt) => (
              <div
                key={hunt.id}
                className="block border border-[#C0C0C0] mb-[15px] bg-white flex items-stretch opacity-75"
              >
                {/* Hunt Image - Square */}
                <div className="w-[150px] h-[170px] flex-shrink-0 bg-[#D0D0D0] flex items-center justify-center overflow-hidden border-r border-[#C0C0C0]">
                  {hunt.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hunt.cover_image_url}
                      alt={hunt.title}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Hunt Details */}
                <div className="px-[10px] py-[10px] flex-grow">
                  <div className="text-base font-bold mb-[5px] leading-[1.2]">
                    {hunt.title}
                  </div>

                  <div className="text-xs text-[#666] mt-[5px]">
                    Completata: {formatRelativeTime(hunt.updated_at || hunt.start_time)}
                  </div>
                  <div className="text-xs text-[#666] mt-[5px]">
                    Indizi: {hunt.clues_count}
                  </div>

                  {/* Prizes */}
                  {hunt.prizes && (
                    <div className="mt-2 pt-[5px] border-t border-dashed border-[#E0E0E0] space-y-1">
                      {(hunt.prizes as any)?.first && (
                        <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                          <span className="inline-block bg-[#FFD700] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                            1°
                          </span>
                          <span className="text-[#333] font-bold">
                            {(hunt.prizes as any).first}
                          </span>
                        </div>
                      )}
                      {(hunt.prizes as any)?.second && (
                        <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                          <span className="inline-block bg-[#C0C0C0] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                            2°
                          </span>
                          <span className="text-[#333] font-bold">
                            {(hunt.prizes as any).second}
                          </span>
                        </div>
                      )}
                      {(hunt.prizes as any)?.third && (
                        <div className="text-xs text-[#008000] font-bold leading-[1.3]">
                          <span className="inline-block bg-[#CD7F32] text-[#333] px-1 py-0 mr-[5px] text-[10px] rounded-sm">
                            3°
                          </span>
                          <span className="text-[#333] font-bold">
                            {(hunt.prizes as any).third}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm py-4">
              Non hai ancora partecipato a nessuna caccia.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
