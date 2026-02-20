'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCamera } from '@/lib/hooks/useCamera'
import { uploadPhoto } from '@/lib/utils/upload'
import { Database } from '@/lib/types/database'

type Hunt = Database['public']['Tables']['hunts']['Row']
type Clue = Database['public']['Tables']['clues']['Row']
type UserClueSubmission = Database['public']['Tables']['user_clue_submissions']['Row']

interface ClueWithSubmission {
  id: string
  clue_number: number
  clue_text: string
  submission: UserClueSubmission | null
}

export default function HuntReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const supabase = createClient()

  const [huntId, setHuntId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [hunt, setHunt] = useState<Hunt | null>(null)
  const [cluesWithSubmissions, setCluesWithSubmissions] = useState<ClueWithSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Camera state
  const [editingClueId, setEditingClueId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { stream, videoRef, startCamera, stopCamera, capturePhoto: takePicture } = useCamera()

  useEffect(() => {
    async function init() {
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

      // Fetch hunt
      const { data: huntData } = await supabase
        .from('hunts')
        .select('*')
        .eq('id', id)
        .single<Hunt>()

      if (!huntData) {
        router.push('/dashboard')
        return
      }

      setHunt(huntData)

      // Check if user completed the hunt
      const { data: participation } = await supabase
        .from('hunt_participants')
        .select('completed_at, total_time_seconds')
        .eq('hunt_id', id)
        .eq('user_id', user.id)
        .single<{ completed_at: string | null; total_time_seconds: number | null }>()

      if (!participation?.completed_at) {
        router.push(`/hunt/${id}`)
        return
      }

      // Fetch all clues and user submissions
      const { data: clues } = await supabase
        .from('clues')
        .select('*')
        .eq('hunt_id', id)
        .order('clue_number', { ascending: true })

      const { data: submissions } = await supabase
        .from('user_clue_submissions')
        .select('*')
        .eq('hunt_id', id)
        .eq('user_id', user.id)

      // Combine clues with their submissions
      const combined: ClueWithSubmission[] = ((clues as Clue[]) || []).map((clue) => {
        const submission = ((submissions as UserClueSubmission[]) || []).find((sub) => sub.clue_id === clue.id)
        return {
          id: clue.id,
          clue_number: clue.clue_number,
          clue_text: clue.clue_text,
          submission: submission || null,
        }
      })

      setCluesWithSubmissions(combined)
      setIsLoading(false)
    }

    init()
  }, [])

  const openCameraForClue = async (clueId: string) => {
    try {
      setEditingClueId(clueId)
      await startCamera()
    } catch (err) {
      console.error('Camera error:', err)
      alert('Errore nell\'accesso alla fotocamera. Controlla i permessi.')
      setEditingClueId(null)
    }
  }

  const cancelCamera = () => {
    stopCamera()
    setEditingClueId(null)
  }

  const handleCapture = async () => {
    if (!editingClueId || !stream) return

    try {
      const photoBlob = await takePicture()
      if (!photoBlob) return

      stopCamera()
      setIsUploading(true)

      // Upload the new photo
      const uploadedUrl = await uploadPhoto(photoBlob, huntId, userId, editingClueId)

      // Update the submission - reset validation when changing photo
      await (supabase as any).from('user_clue_submissions').upsert(
        {
          user_id: userId,
          hunt_id: huntId,
          clue_id: editingClueId,
          photo_url: uploadedUrl,
          is_correct: null,
          ai_validation_result: null,
        },
        { onConflict: 'user_id,hunt_id,clue_id' }
      )

      // Call validation API (non-blocking)
      fetch('/api/validate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: uploadedUrl,
          clueId: editingClueId,
          huntId,
          userId,
        }),
      }).catch((validationError) => {
        console.error('Validation error:', validationError)
      })

      // Update local state
      setCluesWithSubmissions((prev) =>
        prev.map((clue) =>
          clue.id === editingClueId
            ? {
                ...clue,
                submission: clue.submission
                  ? { ...clue.submission, photo_url: uploadedUrl }
                  : ({ photo_url: uploadedUrl } as UserClueSubmission),
              }
            : clue
        )
      )

      setEditingClueId(null)
      setIsUploading(false)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Errore nel caricamento della foto. Riprova.')
      setIsUploading(false)
      setEditingClueId(null)
    }
  }

  if (isLoading) {
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
      <div className="w-full max-w-[400px] bg-white border border-[#D0D0D0] min-h-screen pb-[90px] box-border overflow-x-hidden overflow-y-auto">
        {/* Header */}
         

        {/* Content */}
        <div className="px-5 py-5">
          {/* Title */}
          <div className="text-2xl font-bold text-[#333] mb-5 text-center border-b border-[#E0E0E0] pb-[10px]">
            RIVEDI LA TUA PROVA
          </div>

          {/* Submissions Review */}
          <div className="space-y-4">
            <h3 className="text-base font-bold border-b border-[#E0E0E0] pb-2 mb-3">
              Le Tue Risposte
            </h3>

            {cluesWithSubmissions.map((clue) => {
              const hasSubmission = !!clue.submission
              const isEditing = editingClueId === clue.id

              return (
                <div
                  key={clue.id}
                  className="border rounded-lg overflow-hidden border-[#D0D0D0] bg-white"
                >
                  {/* Clue Header */}
                  <div className="px-4 py-3 border-b border-[#E0E0E0]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#666]">
                        INDIZIO {clue.clue_number}
                      </span>
                    </div>
                    <p className="text-sm text-[#333] italic">{clue.clue_text}</p>
                  </div>

                  {/* Camera View */}
                  {isEditing ? (
                    <div className="relative bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent">
                        <button
                          onClick={handleCapture}
                          disabled={isUploading}
                          className="w-14 h-14 bg-white rounded-full border-4 border-gray-300 shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                        >
                          <span className="sr-only">Capture</span>
                        </button>
                        <button
                          onClick={cancelCamera}
                          disabled={isUploading}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                        >
                          Annulla
                        </button>
                      </div>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white font-bold">Caricamento...</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Submission Image */}
                      {hasSubmission && clue.submission?.photo_url && (
                        <div className="w-full aspect-square bg-[#D0D0D0] relative">
                          <img
                            src={clue.submission.photo_url}
                            alt={`Submission for clue ${clue.clue_number}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Change Photo Button */}
                      <div className="p-3 border-t border-[#E0E0E0]">
                        <button
                          onClick={() => openCameraForClue(clue.id)}
                          className="w-full px-4 py-2 bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border border-[#BBBBBB] rounded-lg text-sm font-medium shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:bg-gradient-to-b hover:from-white hover:to-[#EFEFEF] transition-all flex items-center justify-center gap-2"
                        >
                          <span className="w-4 h-4 bg-[radial-gradient(circle_at_50%_50%,#555_15%,#E0E0E0_20%,#777_60%)] border border-[#555] rounded-full shadow-[inset_0_0_3px_rgba(0,0,0,0.3)]" />
                          Cambia foto
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 w-full max-w-[400px] bg-white px-5 py-[15px] border-t border-[#C0C0C0] shadow-[0_-2px_5px_rgba(0,0,0,0.05)] box-border z-20">
          <Link
            href={`/hunt/${huntId}/results`}
            className="block w-full px-[15px] py-[15px] bg-gradient-to-b from-[#4CAF50] to-[#45a049] text-white border border-[#3d8b40] shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] rounded-lg text-base font-medium uppercase cursor-pointer text-center transition-all hover:bg-gradient-to-b hover:from-[#45a049] hover:to-[#3d8b40] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]"
          >
            CONTINUA AI RISULTATI
          </Link>
        </div>
      </div>
    </div>
  )
}
