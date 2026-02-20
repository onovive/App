'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTimer } from '@/lib/hooks/useTimer'
import { useCamera } from '@/lib/hooks/useCamera'
import { uploadPhoto } from '@/lib/utils/upload'
import { Database } from '@/lib/types/database'

type Hunt = Database['public']['Tables']['hunts']['Row']
type DbClue = Database['public']['Tables']['clues']['Row']
type Submission = Database['public']['Tables']['user_clue_submissions']['Row']

interface Clue {
  id: string
  clue_number: number
  clue_text: string
  hint_text: string | null
}

interface HuntPlayPageProps {
  params: Promise<{ id: string }>
}

export default function HuntPlayPage({ params }: HuntPlayPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [huntId, setHuntId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [clues, setClues] = useState<Clue[]>([])
  const [currentClueIndex, setCurrentClueIndex] = useState(0)
  const [photoStatuses, setPhotoStatuses] = useState<boolean[]>([])
  const [photoUrls, setPhotoUrls] = useState<(string | null)[]>([])
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [huntTitle, setHuntTitle] = useState('')

  const { formattedTime } = useTimer(huntId, true)
  const { stream, videoRef, startCamera, stopCamera, capturePhoto: takePicture } = useCamera()
  const [showCamera, setShowCamera] = useState(false)

  useEffect(() => {
    async function init() {
      // Stop camera if running from previous state
      stopCamera()
      setShowCamera(false)

      const { id } = await params
      setHuntId(id)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Check if user has already completed this hunt
      const { data: participation } = await supabase
        .from('hunt_participants')
        .select('completed_at')
        .eq('hunt_id', id)
        .eq('user_id', user.id)
        .single<{ completed_at: string | null }>()

      if (participation?.completed_at) {
        // User already completed this hunt, redirect to review
        router.push(`/hunt/${id}/review`)
        return
      }

      // Check if hunt is closed (24 hours passed)
      const { data: huntData } = await supabase
        .from('hunts')
        .select('start_time')
        .eq('id', id)
        .single<{ start_time: string }>()

      if (huntData) {
        const now = new Date()
        const startTime = new Date(huntData.start_time)
        const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)

        if (hoursSinceStart >= 24) {
          // Hunt is closed, redirect to rankings
          router.push(`/hunt/${id}/rankings`)
          return
        }
      }

      // Check for clue query parameter
      const urlParams = new URLSearchParams(window.location.search)
      const clueParam = urlParams.get('clue')
      if (clueParam) {
        const clueIndex = parseInt(clueParam, 10)
        if (!isNaN(clueIndex)) {
          setCurrentClueIndex(clueIndex)
          // Reset states when changing clues
          setCapturedPhoto(null)
          setShowCamera(false)
          setIsUploading(false)
        }
      }

      // Fetch hunt and clues
      const { data: hunt } = await supabase
        .from('hunts')
        .select('title, clues_count')
        .eq('id', id)
        .single<Pick<Hunt, 'title' | 'clues_count'>>()

      if (hunt) {
        setHuntTitle(hunt.title)
      }

      const { data: cluesData } = (await supabase
        .from('clues')
        .select('*')
        .eq('hunt_id', id)
        .order('clue_number', { ascending: true })) as { data: DbClue[] | null }

      if (cluesData) {
        setClues(cluesData)
        setPhotoStatuses(new Array(cluesData.length).fill(false))

        // Load existing submissions with photo URLs
        const { data: submissions } = (await supabase
          .from('user_clue_submissions')
          .select('clue_id, photo_url')
          .eq('hunt_id', id)
          .eq('user_id', user.id)) as { data: Pick<Submission, 'clue_id' | 'photo_url'>[] | null }

        if (submissions) {
          const newStatuses = [...new Array(cluesData.length).fill(false)]
          const newPhotoUrls: (string | null)[] = new Array(cluesData.length).fill(null)
          submissions.forEach((sub) => {
            const index = cluesData.findIndex((c) => c.id === sub.clue_id)
            if (index !== -1) {
              newStatuses[index] = true
              newPhotoUrls[index] = sub.photo_url
            }
          })
          setPhotoStatuses(newStatuses)
          setPhotoUrls(newPhotoUrls)
        }
      }

      // Mark hunt as started - use current time as the started_at time
      await (supabase as any)
        .from('hunt_participants')
        .update({ started_at: new Date().toISOString() })
        .eq('hunt_id', id)
        .eq('user_id', user.id)
        .is('started_at', null)
    }

    init()
  }, [])

  const currentClue = clues[currentClueIndex]
  const isLastClue = currentClueIndex === clues.length - 1
  const hasPhoto = photoStatuses[currentClueIndex]
  const allPhotosSubmitted = photoStatuses.length > 0 && photoStatuses.every((status) => status)

  const completeHunt = async () => {
    if (!allPhotosSubmitted) return

    try {
      // Get the started_at time to calculate total time
      const { data: participant } = await supabase
        .from('hunt_participants')
        .select('started_at')
        .eq('hunt_id', huntId)
        .eq('user_id', userId)
        .single<{ started_at: string | null }>()

      if (!participant?.started_at) {
        alert('Errore: tempo di inizio non trovato')
        return
      }

      const startedAt = new Date(participant.started_at)
      const completedAt = new Date()
      const totalTimeSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)

      // Update participant with completion data
      await (supabase as any)
        .from('hunt_participants')
        .update({
          completed_at: completedAt.toISOString(),
          total_time_seconds: totalTimeSeconds,
        })
        .eq('hunt_id', huntId)
        .eq('user_id', userId)

      // Redirect to review page
      router.push(`/hunt/${huntId}/review`)
    } catch (err) {
      console.error('Error completing hunt:', err)
      alert('Errore nel completamento della caccia. Riprova.')
    }
  }

  const nextClue = () => {
    if (currentClueIndex < clues.length - 1) {
      const nextIndex = currentClueIndex + 1
      window.location.href = `/hunt/${huntId}/play?clue=${nextIndex}`
    }
  }

  const prevClue = () => {
    if (currentClueIndex > 0) {
      const prevIndex = currentClueIndex - 1
      window.location.href = `/hunt/${huntId}/play?clue=${prevIndex}`
    }
  }

  const openCamera = async () => {
    try {
      setShowCamera(true)
      await startCamera()
    } catch (err) {
      console.error('Camera error:', err)
      alert('Errore nell\'accesso alla fotocamera. Controlla i permessi.')
      setShowCamera(false)
    }
  }

  const handleCapture = async () => {
    try {
      if (!stream) {
        alert('Camera non avviata. Riprova.')
        return
      }

      const photoBlob = await takePicture()
      if (photoBlob) {
        const photoUrl = URL.createObjectURL(photoBlob)
        setCapturedPhoto(photoUrl)

        // Stop camera after capture
        stopCamera()
        setShowCamera(false)

        // Upload immediately
        setIsUploading(true)
        try {
          const uploadedUrl = await uploadPhoto(photoBlob, huntId, userId, currentClue.id)

          // Save submission
          await (supabase as any).from('user_clue_submissions').upsert({
            user_id: userId,
            hunt_id: huntId,
            clue_id: currentClue.id,
            photo_url: uploadedUrl,
          })

          // Update status and photo URL
          const newStatuses = [...photoStatuses]
          newStatuses[currentClueIndex] = true
          setPhotoStatuses(newStatuses)

          const newPhotoUrls = [...photoUrls]
          newPhotoUrls[currentClueIndex] = uploadedUrl
          setPhotoUrls(newPhotoUrls)

          // Call validation API (non-blocking)
          fetch('/api/validate-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoUrl: uploadedUrl,
              clueId: currentClue.id,
              huntId,
              userId,
            }),
          }).catch((validationError) => {
            console.error('Validation error:', validationError)
          })

          setIsUploading(false)

          // Don't auto-advance - user should click arrow to go to next clue
        } catch (err) {
          console.error('Upload error:', err)
          alert('Errore nel caricamento della foto. Riprova.')
          setIsUploading(false)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      alert('Errore nell\'accesso alla fotocamera. Controlla i permessi.')
    }
  }

  if (!currentClue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECECEC]">
        <div className="text-center">
          <div className="text-xl font-bold mb-4">Caricamento...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center bg-[#ECECEC]">
      <div className="w-full max-w-[400px] bg-white border border-[#D0D0D0] min-h-screen pb-5 box-border overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="bg-[#EFEFEF] border-b border-[#C0C0C0] px-5 py-[15px] flex items-center justify-between sticky top-0 z-10">
          <span className="text-2xl text-[#555] cursor-pointer w-[30px] text-left">
            &#x25C0;
          </span>
          <div className="flex-grow text-lg font-semibold text-center text-[#444]">
            {huntTitle}
          </div>
          <div className="w-[30px]" />
        </div>

        {/* Hunt Content */}
        <div className="px-5 py-5">
          {/* Status Bar */}
          <div className="flex justify-between items-center mb-5 px-[15px] py-[10px] bg-[#F0F0F0] rounded-[5px] border border-[#E0E0E0]">
            <div className="font-bold text-base text-[#FF3B30]">{formattedTime}</div>
            <div className="font-bold text-base text-[#007AFF]">
              Indizio {currentClueIndex + 1} di {clues.length}
            </div>
          </div>

          {/* Clue Section */}
          <div className="bg-white border border-[#D0D0D0] rounded-[5px] px-[15px] py-[15px] mb-5">
            <div className="text-base text-[#555] leading-[1.5] text-center">{currentClue.clue_text}</div>
          </div>

          {/* Camera View or Photo Preview */}
          {showCamera ? (
            <div className="mt-5 relative bg-black rounded-[5px] overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto min-h-[300px] object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent">
                <button
                  onClick={handleCapture}
                  disabled={isUploading}
                  className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <span className="sr-only">Capture</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera()
                    setShowCamera(false)
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Image Preview Area */}
              <div
                className={`mt-5 px-[10px] ${
                  hasPhoto || capturedPhoto
                    ? 'border-2 border-[#4CAF50] min-h-[250px]'
                    : 'border-2 border-dashed border-[#BBBBBB] min-h-[180px]'
                } bg-[#F8F8F8] text-center rounded-[5px] flex flex-col justify-center items-center relative`}
              >
                {capturedPhoto || hasPhoto ? (
                  <>
                    {(capturedPhoto || photoUrls[currentClueIndex]) && (
                      <img
                        src={capturedPhoto || photoUrls[currentClueIndex] || ''}
                        alt="Captured photo"
                        className="w-full h-auto object-cover rounded-[3px] shadow-[0_0_5px_rgba(0,0,0,0.1)]"
                      />
                    )}
                    <div className="absolute top-[5px] right-[5px] bg-[#4CAF50] text-white px-2 py-1 rounded-xl text-xs font-bold">
                      FOTO ALLEGATA
                    </div>
                  </>
                ) : (
                  <div className="text-[#999] italic">Nessuna foto caricata.</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-[15px] mt-5 mb-[30px]">
                <button
                  onClick={openCamera}
                  disabled={isUploading}
                  className="w-full px-[15px] py-[15px] border-none rounded-lg text-base cursor-pointer transition-all flex items-center justify-center bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border border-[#BBBBBB] shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] font-medium hover:bg-gradient-to-b hover:from-white hover:to-[#EFEFEF] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] disabled:opacity-50"
                >
                  <span className="w-[22px] h-[22px] bg-[radial-gradient(circle_at_50%_50%,#555_15%,#E0E0E0_20%,#777_60%)] border-2 border-[#555] rounded-full mr-[10px] shadow-[inset_0_0_5px_rgba(0,0,0,0.3)]" />
                  {isUploading ? 'Caricamento...' : hasPhoto ? 'Modifica foto' : 'Scatta una foto'}
                </button>
              </div>
            </>
          )}

          {/* Clue Navigation */}
          <div className="flex justify-center items-center py-[10px] gap-[40px]">
            <button
              type="button"
              onClick={prevClue}
              disabled={currentClueIndex === 0}
              className={`text-[30px] ${
                currentClueIndex === 0
                  ? 'text-[#C0C0C0] cursor-not-allowed'
                  : 'text-[#555] cursor-pointer hover:text-[#444]'
              } transition-all px-[5px] bg-transparent border-none`}
            >
              &#x2190;
            </button>

            <div className="text-sm font-medium text-[#666]">
              {currentClueIndex + 1} / {clues.length}
            </div>

            <button
              type="button"
              onClick={nextClue}
              disabled={isLastClue}
              className={`text-[30px] ${
                isLastClue
                  ? 'text-[#C0C0C0] cursor-not-allowed'
                  : 'text-[#555] cursor-pointer hover:text-[#444]'
              } transition-all px-[5px] bg-transparent border-none`}
            >
              &#x2192;
            </button>
          </div>

          {/* Complete Hunt Button */}
          {allPhotosSubmitted && (
            <div className="mt-5 mb-5">
              <button
                onClick={completeHunt}
                className="w-full px-[15px] py-[18px] bg-[#4CAF50] text-white rounded-lg text-lg font-bold cursor-pointer transition-all hover:bg-[#45a049] shadow-lg"
              >
                Completa Caccia
              </button>
              <p className="text-center text-sm text-gray-500 mt-2">
                Hai completato tutti gli indizi! Clicca per terminare.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
