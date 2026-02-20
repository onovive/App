import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Database } from '@/lib/types/database'

type Hunt = Database['public']['Tables']['hunts']['Row']
type HuntParticipant = Database['public']['Tables']['hunt_participants']['Row']

export default async function HuntRankingsPage({
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

  // Fetch hunt
  const { data: hunt } = await supabase
    .from('hunts')
    .select('*')
    .eq('id', id)
    .single<Hunt>()

  if (!hunt) {
    redirect('/dashboard')
  }

  // Fetch actual clue count for this hunt
  const { count: actualClueCount } = await supabase
    .from('clues')
    .select('*', { count: 'exact', head: true })
    .eq('hunt_id', id)

  const totalClueCount = actualClueCount || hunt.clues_count

  // Check if 24 hours have passed since start time
const startTime = new Date(new Date(hunt.start_time).getTime() - 60 * 60 * 1000);
  console.log(startTime)
  const now = new Date()
  const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  const rankingsAvailable = hoursSinceStart >= 24

  // Calculate time remaining until rankings are available (in seconds)
  const secondsRemaining = Math.max(0, Math.floor((24 * 60 * 60) - (hoursSinceStart * 60 * 60)))
  const formatCountdown = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Fetch all participants with their results
  const { data: participants } = (await supabase
    .from('hunt_participants')
    .select(
      `
      *,
      profiles!inner (
        username,
        avatar_url
      )
    `
    )
    .eq('hunt_id', id)
    .order('correct_clues', { ascending: false })
    .order('total_time_seconds', { ascending: true })) as { data: any[] | null }

  // Fetch all submissions to calculate actual correct count
  const { data: allSubmissions } = await supabase
    .from('user_clue_submissions')
    .select('user_id, is_correct')
    .eq('hunt_id', id)

  // Update participants with actual correct count
  const participantsWithCorrectCount = (participants || []).map((participant: any) => {
    const userSubmissions = (allSubmissions || []).filter(
      (sub: any) => sub.user_id === participant.user_id
    )
    const correctCount = userSubmissions.filter((sub: any) => sub.is_correct === true).length

    return {
      ...participant,
      correct_clues: correctCount,
    }
  })

  const totalParticipants = participantsWithCorrectCount.length

  // Fix negative times and sort participants
  const participantsWithFixedTimes = participantsWithCorrectCount.map((participant: any) => {
    let totalTimeSeconds = participant.total_time_seconds
    if (totalTimeSeconds && totalTimeSeconds < 0 && participant.started_at && participant.completed_at) {
      const startedAt = new Date(participant.started_at)
      const completedAt = new Date(participant.completed_at)
      totalTimeSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)
    }
    return {
      ...participant,
      total_time_seconds: totalTimeSeconds
    }
  })

  // Sort participants by:
  // 1. Completed first
  // 2. Then by correct clues (more is better)
  // 3. Then by time (faster is better)
  const sortedParticipants = [...participantsWithFixedTimes].sort((a, b) => {
    const aCompleted = !!a.completed_at
    const bCompleted = !!b.completed_at

    // Completed participants come first
    if (aCompleted && !bCompleted) return -1
    if (!aCompleted && bCompleted) return 1

    if (aCompleted && bCompleted) {
      // Both completed - first sort by correct clues (descending)
      const correctDiff = (b.correct_clues || 0) - (a.correct_clues || 0)
      if (correctDiff !== 0) return correctDiff

      // If same correct clues, sort by time (ascending - faster is better)
      return (a.total_time_seconds || 999999) - (b.total_time_seconds || 999999)
    }

    // Neither completed - sort by correct clues (descending)
    const correctDiff = (b.correct_clues || 0) - (a.correct_clues || 0)
    if (correctDiff !== 0) return correctDiff

    // If same correct clues, sort by who started first
    return new Date(a.subscribed_at).getTime() - new Date(b.subscribed_at).getTime()
  })

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex justify-center bg-[#ECECEC]">
      <div className="w-full max-w-[400px] bg-white border border-[#D0D0D0] min-h-screen pb-[90px] box-border overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="bg-[#EFEFEF] border-b border-[#C0C0C0] px-5 py-[15px] flex items-center sticky top-0 z-10">
          <Link
            href="/dashboard"
            className="text-2xl cursor-pointer mr-[15px] text-[#444444] font-bold"
          >
            &#x276E;
          </Link>
          <div className="text-lg font-bold text-[#444444]">
            Classifica Finale
          </div>
        </div>

        {/* Details Section */}
        <div className="px-5 py-5 pb-[90px]">
          {/* Main Title */}
          <div className="text-2xl font-bold text-[#333] mb-[5px] text-center">
            CLASSIFICA FINALE
          </div>
          <div className="text-base text-[#666] mb-5 text-center border-b border-[#E0E0E0] pb-[10px]">
            {hunt.title}
          </div>

          {rankingsAvailable ? (
            <>
              {/* Prize Info */}
              <div className="bg-[#E6F7E6] border border-[#4CAF50] text-[#4CAF50] px-[15px] py-[15px] mt-[30px] mb-5 rounded-[5px] text-sm font-bold text-center">
                Ecco la classifica finale! I vincitori saranno contattati per i premi.
              </div>

              {/* Ranking Table */}
              <table className="w-full border-collapse text-left mt-[15px]">
                <thead className="text-xs text-[#666] uppercase border-b border-[#C0C0C0]">
                  <tr>
                    <th className="px-[5px] py-[10px]">Pos.</th>
                    <th className="px-[5px] py-[10px]">Giocatore</th>
                    <th className="px-[5px] py-[10px] text-center">Clues</th>
                    <th className="px-[5px] py-[10px] text-right pr-[5px]">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((participant: any, index) => {
                    const isCurrentUser = participant.user_id === user.id
                    const rank = index + 1

                    return (
                      <tr
                        key={participant.id}
                        className={`border-b border-[#EAEAEA] ${
                          rank === 1 ? 'bg-[#FFFEEE]' : ''
                        } ${index === 2 ? 'border-b-[#333]' : ''}`}
                      >
                        {/* Rank */}
                        <td
                          className={`text-lg font-bold px-[5px] py-[10px] text-center ${
                            rank === 1
                              ? 'text-[#FFD700] text-[22px]'
                              : rank === 2
                              ? 'text-[#C0C0C0]'
                              : rank === 3
                              ? 'text-[#CD7F32]'
                              : ''
                          }`}
                        >
                          {rank}
                        </td>

                        {/* User */}
                        <td className="px-0 py-[10px]">
                          <div className="flex items-center">
                            <div className="w-[35px] h-[35px] rounded-full bg-[#007BFF] mr-[10px] flex-shrink-0 overflow-hidden">
                              {participant.profiles?.avatar_url ? (
                                <img
                                  src={participant.profiles.avatar_url}
                                  alt={participant.profiles.username || 'User'}
                                  width={35}
                                  height={35}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                                  {participant.profiles?.username?.[0]?.toUpperCase() ||
                                    'U'}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-bold text-[#333] overflow-hidden text-ellipsis whitespace-nowrap">
                              {participant.profiles?.username || 'Unknown'}
                              {isCurrentUser && ' (Tu)'}
                            </span>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="text-[13px] font-bold text-center text-[#444]">
                          {participant.correct_clues} / {totalClueCount}
                        </td>

                        {/* Time */}
                        <td className="text-[13px] font-bold text-right text-[#444] pr-[5px]">
                          {participant.completed_at ? (
                            formatTime(participant.total_time_seconds)
                          ) : (
                            <span className="text-[#A0A0A0] font-normal italic">
                              Ha mollato
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <>
              {/* Rankings Not Available Yet */}
              <div className="bg-[#FFF3CD] border border-[#FFCC00] text-[#856404] px-[15px] py-[20px] mt-[30px] mb-5 rounded-[5px] text-center">
                <div className="text-4xl mb-3">⏳</div>
                <div className="text-base font-bold mb-2">
                  Classifica non ancora disponibile
                </div>
                <div className="text-sm">
                  La classifica sarà visibile tra <span className="font-bold">{formatCountdown(secondsRemaining)}</span> 
                </div>
              </div>

              <div className="text-center text-sm text-[#666] mt-5">
                Torna più tardi per vedere i risultati!
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 w-full max-w-[400px] bg-white px-5 py-[15px] border-t border-[#C0C0C0] shadow-[0_-2px_5px_rgba(0,0,0,0.05)] box-border z-20">
        <Link
          href="/dashboard"
          className="block w-full px-[15px] py-[15px] bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border border-[#BBBBBB] shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium cursor-pointer text-center transition-all hover:bg-gradient-to-b hover:from-white hover:to-[#EFEFEF] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)]"
        >
          Torna alla Dashboard
        </Link>
      </div>
    </div>
  )
}
