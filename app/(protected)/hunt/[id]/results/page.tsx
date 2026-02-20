import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Database } from '@/lib/types/database'

type Hunt = Database['public']['Tables']['hunts']['Row']
type HuntParticipant = Database['public']['Tables']['hunt_participants']['Row']

export default async function HuntResultsPage({
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

  // Fetch user's participation
  const { data: participation } = await supabase
    .from('hunt_participants')
    .select('*')
    .eq('hunt_id', id)
    .eq('user_id', user.id)
    .single<HuntParticipant>()

  if (!participation) {
    redirect('/dashboard')
  }

  // Fetch actual clue count for this hunt
  const { count: actualClueCount } = await supabase
    .from('clues')
    .select('*', { count: 'exact', head: true })
    .eq('hunt_id', id)

  // Fetch user's submissions with validation results
  const { data: submissions } = (await supabase
    .from('user_clue_submissions')
    .select(
      `
      *,
      clues (
        clue_number,
        clue_text
      )
    `
    )
    .eq('hunt_id', id)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: true })) as { data: any[] | null }

  const correctCount = submissions?.filter((s) => s.is_correct).length || 0
  const totalCount = actualClueCount || hunt.clues_count

  // Fix negative time by recalculating if needed
  let totalTimeSeconds = participation.total_time_seconds
  if (totalTimeSeconds && totalTimeSeconds < 0 && participation.started_at && participation.completed_at) {
    // Recalculate the correct time
    const startedAt = new Date(participation.started_at)
    const completedAt = new Date(participation.completed_at)
    totalTimeSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)
  }

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

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
          <div className="text-lg font-bold text-[#444444]">Riepilogo Hunt</div>
        </div>

        {/* Details Section */}
        <div className="px-5 py-5 text-center">
          {/* Main Title */}
          <div className="text-[28px] font-bold text-[#333] mb-[30px] uppercase">
            Congratulazioni!
          </div>

          {/* Summary Block */}
          <div className="bg-[#F8F8F8] px-[10px] py-[15px] rounded-lg mb-[30px] border border-[#E0E0E0]">
            <div className="flex justify-between items-center py-3 border-b border-dotted border-[#D0D0D0]">
              <span className="text-[15px] text-[#444] font-medium">
                Indizi Corretti:
              </span>
              <span className="text-lg font-bold text-[#333]">
                {correctCount} / {totalCount}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[15px] text-[#444] font-medium">
                Tempo Impiegato:
              </span>
              <span className="text-lg font-bold text-[#333]">
                {totalTimeSeconds
                  ? formatTime(totalTimeSeconds)
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Submissions */}
          <div className="text-left">
            <h3 className="text-base font-bold mt-5 mb-[15px] border-b border-dashed border-[#E0E0E0] pb-[5px] text-[#333]">
              I tuoi ritrovamenti
            </h3>

            {submissions && submissions.length > 0 ? (
              submissions.map((submission: any) => (
                <div
                  key={submission.id}
                  className={`flex justify-between p-0 mb-[15px] rounded-[5px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-left relative border ${
                    submission.is_correct
                      ? 'border-[#A5D6A7]'
                      : 'border-[#EF9A9A]'
                  }`}
                >
                  {/* Status Bar */}
                  <div
                    className={`w-[10px] h-full absolute left-0 top-0 rounded-tl-[5px] rounded-bl-[5px] ${
                      submission.is_correct ? 'bg-[#66BB6A]' : 'bg-[#E57373]'
                    }`}
                  />

                  {/* Icon Overlay */}
                  <div
                    className={`absolute top-[5px] left-[5px] w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-xs font-bold z-[5] ${
                      submission.is_correct ? 'text-[#66BB6A]' : 'text-[#E57373]'
                    }`}
                  >
                    {submission.is_correct ? '✓' : '✗'}
                  </div>

                  {/* Content */}
                  <div className="px-[10px] py-[10px] pl-[25px] flex-grow">
                    <div className="text-sm font-bold mb-[5px] text-[#333]">
                      {submission.clues?.clue_text || 'Clue'}
                    </div>
                    <div className="text-xs text-[#666] mt-[5px]">
                      {submission.is_correct
                        ? `Trovato`
                        : 'Immagine non autentica'}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="w-20 h-20 overflow-hidden bg-[#E0E0E0] m-[10px] ml-0 rounded-[3px] flex-shrink-0">
                    {submission.photo_url && (
                      <img
                        src={submission.photo_url}
                        alt="Submission"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm py-4">
                Nessun ritrovamento ancora.
              </div>
            )}
          </div>

        
        </div>

        {/* Action Bar */}
        <div className="w-full bg-white px-5 py-[15px] border-t border-[#C0C0C0] box-border space-y-3">
          <Link
            href={`/hunt/${id}/rankings`}
            className="block w-full px-[15px] py-[15px] bg-gradient-to-b from-[#4CAF50] to-[#45a049] text-white border border-[#3d8b40] shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] rounded-lg text-base font-medium uppercase cursor-pointer text-center transition-all hover:bg-gradient-to-b hover:from-[#45a049] hover:to-[#3d8b40] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]"
          >
            GUARDA LA CLASSIFICA
          </Link>
          <Link
            href="/dashboard"
            className="block w-full px-[15px] py-[15px] bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border border-[#BBBBBB] shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium uppercase cursor-pointer text-center transition-all hover:bg-gradient-to-b hover:from-white hover:to-[#EFEFEF] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)]"
          >
            TORNA ALLA DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  )
}
