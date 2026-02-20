'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const EXPLORER_TYPES = [
  { type: 'Urban', label: 'ESPLORATORE IMPULSIVO', color: 'bg-[#4CAF50]' },
  { type: 'Trail', label: 'CARTOGRAFO SELVAGGIO', color: 'bg-[#2196F3]' },
  { type: 'Mystery', label: 'RICERCATORE RANDAGIO', color: 'bg-[#FF9800]' },
  { type: 'Geo', label: 'ESPLORATORE LATERALE', color: 'bg-[#9C27B0]' },
  { type: 'Riddle', label: 'DETECTIVE CREPUSCOLARE', color: 'bg-[#F44336]' },
  { type: 'Digital', label: 'INVESTIGATORE VISIONARIO', color: 'bg-[#00BCD4]' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [selectedExplorerType, setSelectedExplorerType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Check auth on mount and refresh session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First try to get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
        }

        if (session?.user) {
          setUserId(session.user.id)
          setIsCheckingAuth(false)
          return
        }

        // If no session, try refreshing
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('Auth check error:', userError)
          // Redirect to login if not authenticated
          router.push('/login')
          return
        }

        if (user) {
          setUserId(user.id)
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/login')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  // Debounced username check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      await checkUsernameAvailability(username)
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    const trimmed = usernameToCheck.trim().toLowerCase()

    // Simulate blocked usernames
    if (trimmed.includes('admin') || trimmed === 'nico') {
      setUsernameStatus('unavailable')
      return
    }

    // Check in database
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', usernameToCheck.trim())
      .single()

    if (data) {
      setUsernameStatus('unavailable')
    } else {
      setUsernameStatus('available')
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const isFormValid = () => {
    return (
      usernameStatus === 'available' &&
      selectedExplorerType !== null &&
      userId !== null
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setIsSubmitting(true)
    setError('')

    try {
      if (!userId) {
        setError('Sessione scaduta. Effettua nuovamente il login.')
        router.push('/login')
        return
      }

      // Upload avatar (optional - continue even if it fails)
      let avatarUrl = ''
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop()
          const fileName = `${userId}/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, {
              upsert: true,
            })

          if (uploadError) {
            console.error('Avatar upload error:', uploadError)
            // Continue without avatar - don't fail the whole onboarding
          } else {
            const {
              data: { publicUrl },
            } = supabase.storage.from('avatars').getPublicUrl(fileName)
            avatarUrl = publicUrl
          }
        } catch (uploadErr) {
          console.error('Avatar upload exception:', uploadErr)
          // Continue without avatar
        }
      }

      // Update profile
      const updateData: Record<string, unknown> = {
        username: username.trim(),
        explorer_type: selectedExplorerType,
        onboarding_completed: true,
      }

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl
      }

      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (profileError) {
        console.error('Profile update error:', profileError)
        setError(`Errore nel salvataggio: ${profileError.message}`)
        setIsSubmitting(false)
        return
      }

      // Redirect to dashboard
      router.push(' /dashboard')
    } catch (err) {
      console.error('Error during onboarding:', err)
      setError(err instanceof Error ? err.message : 'Si è verificato un errore. Riprova.')
      setIsSubmitting(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECECEC]">
        <div className="text-[#666]">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-[#ECECEC] px-5 py-5">
      <div className="w-full max-w-[400px] bg-white border border-[#D0D0D0] p-5 box-border">
        {/* App Header with Logo */}
        <div className="flex justify-center mb-[30px] pb-[10px]">
          <img src="/LOGO.svg" alt="PeriodiQ" className="h-10" />
        </div>

        {/* Screen Title */}
        <div className="text-lg font-semibold text-left mb-[25px] pb-[5px] border-b border-[#EFEFEF]">
          Completa il tuo profilo per iniziare
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[#F8D7DA] border border-[#F5C6CB] text-[#721C24] px-[10px] py-[10px] mb-4 rounded-[5px] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar & Username */}
          <div className="mb-[25px]">
            <label className="block mb-2 text-sm font-semibold">
              Info Utente:
            </label>
            <div className="flex items-start gap-[15px]">
              {/* Avatar Container */}
              <div className="relative w-[90px] h-[90px] flex-shrink-0">
                <div
                  className="w-full h-full bg-[#C0C0C0] rounded-full border-2 border-white shadow-[0_0_0_1px_#A0A0A0] flex items-center justify-center text-[#666] text-[11px] text-center cursor-pointer absolute top-0 left-0 overflow-hidden bg-cover bg-center"
                  style={{
                    backgroundImage: avatarPreview
                      ? `url(${avatarPreview})`
                      : 'none',
                  }}
                  onClick={handleAvatarClick}
                >
                  {!avatarPreview && <span>Add Photo</span>}
                </div>
                <div
                  className="absolute bottom-0 right-0 w-[30px] h-[30px] bg-[#666] text-white rounded-full flex items-center justify-center text-lg font-bold cursor-pointer border-2 border-white shadow-[0_0_0_1px_#A0A0A0] leading-none"
                  onClick={handleAvatarClick}
                >
                  📷
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Username Input */}
              <input
                type="text"
                placeholder="Scegli il tuo nome utente"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="flex-grow px-[10px] mt-[15px] text-base border border-[#C0C0C0] bg-white h-[40px] box-border"
              />
            </div>

            {/* Username Feedback */}
            <div className="text-xs mt-[5px] ml-[105px] min-h-[15px]">
              {usernameStatus === 'checking' && (
                <span className="text-gray-500">Checking...</span>
              )}
              {usernameStatus === 'available' && (
                <span className="text-green-600">Disponibile!</span>
              )}
              {usernameStatus === 'unavailable' && (
                <span className="text-red-600">
                  Non disponibile. Prova un altro nome.
                </span>
              )}
              {usernameStatus === 'idle' && username.length > 0 && username.length < 3 && (
                <span className="text-gray-500">
                  Il nome utente deve avere almeno 3 caratteri.
                </span>
              )}
            </div>
          </div>

          {/* Explorer Type */}
          <div className="mb-[25px]">
            <label className="block mb-2 text-sm font-semibold">
              Scegli che giocatore sei:
            </label>
            <div className="flex flex-wrap gap-[10px]">
              {EXPLORER_TYPES.map(({ type, label, color }) => (
                <div
                  key={type}
                  className={`w-[calc((100%-20px)/3)] px-1 py-[6px] border ${
                    selectedExplorerType === type
                      ? 'border-[3px] border-[#333333] scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
                      : 'border-[#C0C0C0]'
                  } text-[10px] cursor-pointer text-center text-white font-semibold rounded ${color} transition-all box-border leading-[1.2]`}
                  onClick={() => setSelectedExplorerType(type)}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className="w-full mt-[30px] px-[15px] py-[15px] bg-gradient-to-b from-[#F8F8F8] to-[#E0E0E0] text-[#444444] border border-[#BBBBBB] shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-lg text-base font-medium uppercase cursor-pointer text-center transition-all hover:enabled:bg-gradient-to-b hover:enabled:from-white hover:enabled:to-[#EFEFEF] hover:enabled:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] disabled:opacity-80 disabled:cursor-not-allowed disabled:shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:bg-[#EFEFEF] disabled:text-[#A0A0A0] disabled:border-[#E0E0E0]"
          >
            {isSubmitting ? 'Salvataggio...' : 'Continua'}
          </button>
        </form>
      </div>
    </div>
  )
}
