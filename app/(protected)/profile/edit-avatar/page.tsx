'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EditAvatarPage() {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert('Immagine del profilo aggiornata con successo!')
      router.push('/profile')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Impossibile caricare l\'immagine del profilo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen flex justify-center bg-[#ECECEC]">
      <div className="w-full max-w-[400px] bg-white border border-[#D0D0D0] min-h-screen pb-5 box-border overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="bg-[#EFEFEF] border-b border-[#C0C0C0] px-5 py-[15px] flex items-center sticky top-0 z-10">
          <Link
            href="/profile"
            className="text-2xl cursor-pointer mr-[15px] text-[#444444] font-bold"
          >
            &#x276E;
          </Link>
          <div className="text-lg font-bold text-[#444444]">
            Cambia immagine del profilo
          </div>
        </div>

        <div className="px-5 py-5">
          {/* Upload from device */}
          <div className="mb-8">
            <h3 className="text-base font-bold mb-3 text-[#333]">
              Carica dal dispositivo
            </h3>
            <label className="block w-full px-4 py-3 bg-indigo-600 text-white rounded-lg text-center cursor-pointer hover:bg-indigo-700 transition-colors">
              {uploading ? 'Caricamento...' : 'Scegli file'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Formati supportati: JPG, PNG, GIF (max 5 MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
