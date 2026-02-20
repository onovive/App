'use client'

import { useState, useRef, useCallback } from 'react'

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      setStream(mediaStream)
      setIsLoading(false)

      // Attach stream to video element if ref exists
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      return mediaStream
    } catch (err) {
      console.error('Camera error:', err)
      setError(
        'Impossibile accedere alla fotocamera. Assicurati di aver dato i permessi.'
      )
      setIsLoading(false)
      return null
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  const capturePhoto = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null)
        return
      }

      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      ctx.drawImage(video, 0, 0)

      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/jpeg',
        0.9
      )
    })
  }, [])

  return {
    stream,
    error,
    isLoading,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
  }
}
