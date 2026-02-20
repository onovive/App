import { createClient } from '@/lib/supabase/client'

/**
 * Compress an image blob before upload
 */
async function compressImage(
  blob: Blob,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      // Create canvas and compress
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob)
          } else {
            reject(new Error('Compression failed'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}

/**
 * Upload a photo to Supabase Storage
 */
export async function uploadPhoto(
  file: Blob,
  huntId: string,
  userId: string,
  clueId: string
): Promise<string> {
  const supabase = createClient()

  // Compress image
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
  })

  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${huntId}/${userId}/${clueId}/${timestamp}.jpg`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('clue-photos')
    .upload(fileName, compressed, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('clue-photos').getPublicUrl(fileName)

  return publicUrl
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: Blob, userId: string): Promise<string> {
  const supabase = createClient()

  // Compress image
  const compressed = await compressImage(file, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.9,
  })

  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${userId}/${timestamp}.jpg`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, compressed, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(fileName)

  return publicUrl
}

/**
 * Upload hunt cover image
 */
export async function uploadHuntCover(file: Blob): Promise<string> {
  const supabase = createClient()

  // Compress image
  const compressed = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
  })

  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${timestamp}.jpg`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('hunt-covers')
    .upload(fileName, compressed, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('hunt-covers').getPublicUrl(fileName)

  return publicUrl
}
