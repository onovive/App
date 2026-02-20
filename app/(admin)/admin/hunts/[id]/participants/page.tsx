import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Database } from '@/lib/types/database'
import Image from 'next/image'

type Hunt = Database['public']['Tables']['hunts']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Participant = Database['public']['Tables']['hunt_participants']['Row']
type Submission = Database['public']['Tables']['user_clue_submissions']['Row']
type Clue = Database['public']['Tables']['clues']['Row']

interface ParticipantWithProfile extends Participant {
  profile: Profile
}

interface SubmissionWithClue extends Submission {
  clue: Clue
}

interface ParticipantData {
  participant: ParticipantWithProfile
  submissions: SubmissionWithClue[]
}

export default async function HuntParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: huntId } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch hunt details
  const { data: hunt } = await supabase
    .from('hunts')
    .select('*')
    .eq('id', huntId)
    .single<Hunt>()

  if (!hunt) {
    return (
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Hunt not found</h1>
      </div>
    )
  }

  // Fetch all participants with their profiles
  const { data: participants } = await supabase
    .from('hunt_participants')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('hunt_id', huntId)
    .order('subscribed_at', { ascending: false })

  // Fetch all submissions for this hunt
  const { data: submissions } = await supabase
    .from('user_clue_submissions')
    .select(`
      *,
      clue:clues(*)
    `)
    .eq('hunt_id', huntId)

  // Group submissions by user and calculate correct count
  const participantsData: ParticipantData[] = (participants as any[] || []).map((participant: any) => {
    const userSubmissions = (submissions as any[] || [])
      .filter((sub: any) => sub.user_id === participant.user_id)
      .sort((a: any, b: any) => (a.clue?.clue_number || 0) - (b.clue?.clue_number || 0)) // Sort by clue number

    // Calculate actual correct clues from submissions
    const correctCount = userSubmissions.filter((sub: any) => sub.is_correct === true).length

    return {
      participant: {
        ...participant,
        correct_clues: correctCount, // Override with actual count
      },
      submissions: userSubmissions,
    }
  })

  // Sort participants for rankings
  // 1. Completed first
  // 2. Then by correct clues (more is better)
  // 3. Then by time (faster is better)
  const rankedParticipants = [...participantsData].sort((a, b) => {
    const aCompleted = !!a.participant.completed_at
    const bCompleted = !!b.participant.completed_at

    // Completed participants come first
    if (aCompleted && !bCompleted) return -1
    if (!aCompleted && bCompleted) return 1

    if (aCompleted && bCompleted) {
      // Both completed - first sort by correct clues (descending)
      const correctDiff = (b.participant.correct_clues || 0) - (a.participant.correct_clues || 0)
      if (correctDiff !== 0) return correctDiff

      // If same correct clues, sort by time (ascending - faster is better)
      return (a.participant.total_time_seconds || 999999) - (b.participant.total_time_seconds || 999999)
    }

    // Neither completed - sort by correct clues (descending)
    return (b.participant.correct_clues || 0) - (a.participant.correct_clues || 0)
  })

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/hunts"
              className="text-indigo-600 hover:text-indigo-900"
            >
              ← Back to Hunts
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{hunt.title}</h1>
          <p className="mt-2 text-sm text-gray-700">
            View all participants and their photo submissions for this hunt
          </p>
        </div>
      </div>

      {/* Rankings Table */}
      {rankedParticipants.length > 0 && (
        <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white">Classifica</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giocatore</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Indizi</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankedParticipants.map(({ participant, submissions }, index) => {
                const rank = index + 1
                const isCompleted = !!participant.completed_at
                return (
                  <tr key={participant.id} className={rank <= 3 && isCompleted ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${
                        rank === 1 && isCompleted ? 'text-yellow-500' :
                        rank === 2 && isCompleted ? 'text-gray-400' :
                        rank === 3 && isCompleted ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                          {participant.profile?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-gray-900">{participant.profile?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="font-semibold text-gray-900">{participant.correct_clues || 0}</span>
                      <span className="text-gray-500"> / {hunt.clues_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-sm">
                      {isCompleted ? (
                        <span className="text-green-600 font-semibold">{formatTime(participant.total_time_seconds)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isCompleted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completato
                        </span>
                      ) : submissions.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          In Corso
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Iscritto
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Participant Details */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dettagli Partecipanti</h2>
        {participantsData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No participants yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {rankedParticipants.map(({ participant, submissions }, index) => {
              const rank = index + 1
              const isCompleted = !!participant.completed_at
              return (
              <div
                key={participant.id}
                className="bg-white shadow-md rounded-lg overflow-hidden"
              >
                {/* Participant Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        rank === 1 && isCompleted ? 'bg-yellow-400 text-yellow-900' :
                        rank === 2 && isCompleted ? 'bg-gray-300 text-gray-700' :
                        rank === 3 && isCompleted ? 'bg-amber-500 text-amber-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {rank}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {participant.profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {participant.profile?.username || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {participant.profile?.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {isCompleted ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Completato in {formatTime(participant.total_time_seconds)}
                          </span>
                        ) : submissions.length > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            In Corso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Iscritto
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {submissions.length} / {hunt.clues_count} foto caricate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submissions Grid */}
                <div className="p-6">
                  {submissions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No photos submitted yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="aspect-square relative bg-gray-100">
                            <Image
                              src={submission.photo_url}
                              alt={`Clue ${submission.clue?.clue_number}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-3 bg-white">
                            <div className="text-sm font-semibold text-gray-900">
                              Clue {submission.clue?.clue_number}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {submission.clue?.clue_text}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              {submission.submitted_at.replace('T', ' ').substring(0, 16)}
                            </div>
                            {submission.is_correct !== null && (
                              <div className="mt-2">
                                {submission.is_correct ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Correct
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                    ✗ Incorrect
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}
