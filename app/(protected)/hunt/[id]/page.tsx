import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscribeButton from '@/components/hunt/SubscribeButton'
import ParticipantsList from '@/components/hunt/ParticipantsList'
import Link from 'next/link'

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

export default async function HuntDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch hunt details
  const { data: hunt, error } = (await supabase
    .from('hunts')
    .select('*')
    .eq('id', id)
    .single()) as { data: Hunt | null; error: any }

  if (error || !hunt) {
    redirect('/dashboard')
  }

  // Check if user is subscribed, completed, and get total participant count
  const [participationResult, participantCountResult] = await Promise.all([
    (supabase as any)
      .from('hunt_participants')
      .select('*')
      .eq('hunt_id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('hunt_participants')
      .select('id', { count: 'exact', head: true })
      .eq('hunt_id', id)
  ])

  const isSubscribed = !!participationResult.data
  const hasCompleted = !!participationResult.data?.completed_at
  const participantCount = participantCountResult.count || 0

  // Format start time - displays time as stored in database without conversion
  const formatStartTime = (startTime: string) => {
    const [datePart, timePart] = startTime.split('T')
    const [, month, day] = datePart.split('-')
    const [hour, minute] = timePart.split(':')
    const monthNames = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC']
    const monthName = monthNames[parseInt(month) - 1]
    return `${day} ${monthName}, ${hour}:${minute}`
  }

  // Check if 24 hours have passed since start time
  const now = new Date()
  const startTime = new Date(hunt.start_time)
  const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  const isClosed = hoursSinceStart >= 24

  // Check if hunt can be started
  const canStart = isSubscribed && hunt.status === 'active' && !isClosed

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
          <div className="text-lg font-bold text-[#444444]">Dettagli</div>
        </div>

        {/* Cover Image */}
        <div className="w-full pt-[100%] relative overflow-hidden bg-[#A0A0A0] mb-5 border-b border-[#C0C0C0]">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            {hunt.cover_image_url ? (
              <img
                src={hunt.cover_image_url}
                alt={hunt.title} 
                className="object-cover"
              />
            ) : (
              <div className="text-white text-xl">No Image</div>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="px-5">
          {/* Confirmation Message */}
          {isSubscribed && (
            <div className="bg-[#E6F7E6] border border-[#4CAF50] text-[#4CAF50] px-[15px] py-[15px] mb-5 rounded-[5px] font-bold text-center">
              Sei iscritto!
            </div>
          )}

          {/* Hunt Title */}
          <div className="text-2xl font-bold mb-[15px] text-black text-center mt-0">
            {hunt.title}
          </div>

          {/* Info Block */}
          <div className="mb-5 py-[10px] border-t border-b border-[#E0E0E0]">
            <div className="text-sm font-medium py-[5px] flex justify-between">
              <span className="text-[#666]">Inizio:</span>
              <span className="font-bold text-[#CC0000]">
                {formatStartTime(hunt.start_time)}
              </span>
            </div>
            <div className="text-sm font-medium py-[5px] flex justify-between">
              <span className="text-[#666]">Indizi:</span>
              <span className="font-bold">{hunt.clues_count}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <h3 className="text-base font-bold mt-5 mb-[10px] border-b border-dashed border-[#E0E0E0] pb-[5px]">
              Descrizione della Caccia
            </h3>
            <p className="text-sm leading-[1.6] text-[#444]">
              {hunt.description ||
                "Preparati a perderti nel labirinto urbano di misteri e codici! Risolvi enigmi, decifra messaggi segreti e sblocca la posizione finale prima dei tuoi avversari per vincere i premi in palio!"}
            </p>
          </div>

          {/* Prizes */}
          {hunt.prizes && (
            <div className="mt-5 mb-[25px]">
              <h3 className="text-base font-bold mt-5 mb-[10px] border-b border-dashed border-[#E0E0E0] pb-[5px]">
                Premi in Palio
              </h3>
              {(hunt.prizes as any).first && (
                <div className="text-sm leading-[1.6]">
                  <span className="inline-block bg-[#FFD700] text-[#333] px-[6px] py-[2px] mr-2 text-[11px] rounded-[3px] font-bold text-center w-[30px]">
                    1°
                  </span>
                  <span className="font-bold">{(hunt.prizes as any).first}</span>
                </div>
              )}
              {(hunt.prizes as any).second && (
                <div className="text-sm leading-[1.6] mt-1">
                  <span className="inline-block bg-[#C0C0C0] text-[#333] px-[6px] py-[2px] mr-2 text-[11px] rounded-[3px] font-bold text-center w-[30px]">
                    2°
                  </span>
                  <span className="font-bold">{(hunt.prizes as any).second}</span>
                </div>
              )}
              {(hunt.prizes as any).third && (
                <div className="text-sm leading-[1.6] mt-1">
                  <span className="inline-block bg-[#CD7F32] text-[#333] px-[6px] py-[2px] mr-2 text-[11px] rounded-[3px] font-bold text-center w-[30px]">
                    3°
                  </span>
                  <span className="font-bold">{(hunt.prizes as any).third}</span>
                </div>
              )}
            </div>
          )}

          {/* Participants List */}
          <div className="mb-5">
            <h3 className="text-base font-bold mt-5 mb-[10px] border-b border-dashed border-[#E0E0E0] pb-[5px]">
              Partecipanti ({participantCount})
            </h3>
            <ParticipantsList huntId={id} userId={user.id} />
          </div>

          <div className="h-5" />
        </div>

        {/* Action Bar */}
        <div className="w-full bg-white px-5 py-[15px] border-t border-[#C0C0C0] box-border space-y-3">
          {!isSubscribed ? (
            <SubscribeButton
              huntId={id}
              userId={user.id}
              isSubscribed={isSubscribed}
            />
          ) : hasCompleted ? (
            <>
              <div className="bg-[#E6F7E6] border border-[#4CAF50] text-[#4CAF50] px-[15px] py-[10px] rounded-[5px] font-bold text-center text-sm">
                Hai già completato questa caccia!
              </div>
              <Link
                href={`/hunt/${id}/rankings`}
                className="block w-full px-[15px] py-[15px] border shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium uppercase text-center transition-all bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border-[#BBBBBB] hover:from-white hover:to-[#EFEFEF] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15)]"
              >
                VEDI CLASSIFICA
              </Link>
            </>
          ) : isClosed ? (
            <>
              <div className="bg-[#FFEBEE] border border-[#E57373] text-[#E57373] px-[15px] py-[10px] rounded-[5px] font-bold text-center text-sm">
                ⏱️ Caccia Chiusa (24 ore terminate)
              </div>
              <Link
                href={`/hunt/${id}/rankings`}
                className="block w-full px-[15px] py-[15px] border shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium uppercase text-center transition-all bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border-[#BBBBBB] hover:from-white hover:to-[#EFEFEF] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15)]"
              >
                VEDI CLASSIFICA
              </Link>
            </>
          ) : canStart ? (
            <>
              <Link
                href={`/hunt/${id}/play`}
                className="block w-full px-[15px] py-[15px] border shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium uppercase text-center transition-all bg-gradient-to-b from-[#4CAF50] to-[#45A049] text-white border-[#4CAF50] hover:from-[#45A049] hover:to-[#3D8B40] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15)]"
              >
                INIZIA LA CACCIA
              </Link>
              <SubscribeButton
                huntId={id}
                userId={user.id}
                isSubscribed={isSubscribed}
              />
            </>
          ) : hunt.status === 'completed' ? (
            <Link
              href={`/hunt/${id}/rankings`}
              className="block w-full px-[15px] py-[15px] border shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium uppercase text-center transition-all bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border-[#BBBBBB] hover:from-white hover:to-[#EFEFEF] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15)]"
            >
              VEDI CLASSIFICA
            </Link>
          ) : (
            <SubscribeButton
              huntId={id}
              userId={user.id}
              isSubscribed={isSubscribed}
            />
          )}
        </div>
      </div>
    </div>
  )
}
