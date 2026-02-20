'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { uploadHuntCover } from '@/lib/utils/upload'

interface HuntFormProps {
  hunt?: {
    id: string
    title: string
    description: string | null
    start_time: string
    duration_minutes: number
    cover_image_url: string | null
    clues_count: number
    prizes: any
    status: string
  }
}

export default function HuntForm({ hunt }: HuntFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(hunt?.cover_image_url || null)

  const [formData, setFormData] = useState(() => {
    const startTimeValue = hunt?.start_time ? hunt.start_time.substring(0, 16) : ''

    console.log('HuntForm Init Debug:', {
      huntStartTime: hunt?.start_time,
      extractedValue: startTimeValue
    })

    return {
      title: hunt?.title || '',
      description: hunt?.description || '',
      start_time: startTimeValue,
      duration_minutes: hunt?.duration_minutes || 60,
      cover_image_url: hunt?.cover_image_url || '',
      clues_count: hunt?.clues_count || 5,
      status: hunt?.status || 'upcoming',
      prize_first: (hunt?.prizes as any)?.first || '',
      prize_second: (hunt?.prizes as any)?.second || '',
      prize_third: (hunt?.prizes as any)?.third || '',
    }
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Upload image if a new one was selected
      let coverImageUrl = formData.cover_image_url
      if (imageFile) {
        setIsUploadingImage(true)
        try {
          coverImageUrl = await uploadHuntCover(imageFile)
        } catch (uploadError: any) {
          alert(`Image upload failed: ${uploadError.message}`)
          setIsSubmitting(false)
          setIsUploadingImage(false)
          return
        }
        setIsUploadingImage(false)
      }

      const prizes = {
        first: formData.prize_first,
        second: formData.prize_second,
        third: formData.prize_third,
      }

      // Store the exact time as entered by user
      // datetime-local gives us "YYYY-MM-DDTHH:mm" format
      // Add seconds and +00:00 to match timestamptz format
      const startTimeISO = formData.start_time + ':00+00:00'

      console.log('HuntForm Save Debug:', {
        formDataStartTime: formData.start_time,
        startTimeISO,
        originalHuntTime: hunt?.start_time
      })

      const huntData = {
        title: formData.title,
        description: formData.description || null,
        start_time: startTimeISO,
        duration_minutes: formData.duration_minutes,
        cover_image_url: coverImageUrl || null,
        clues_count: formData.clues_count,
        prizes,
        // For new hunts, default to 'upcoming'. For existing hunts, use the selected status.
        status: hunt ? formData.status : 'upcoming',
      }

      if (hunt) {
        // Update existing hunt
        const { error } = await (supabase as any)
          .from('hunts')
          .update(huntData)
          .eq('id', hunt.id)

        if (error) throw error
        alert('Hunt updated successfully!')
      } else {
        // Create new hunt
        const { error } = await (supabase as any)
          .from('hunts')
          .insert(huntData)

        if (error) throw error
        alert('Hunt created successfully!')
      }

      router.push('/admin/hunts')
      router.refresh()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          {/* Title */}
          <div className="sm:col-span-4">
            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
              Hunt Title
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Description */}
          <div className="col-span-full">
            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
              Description
            </label>
            <div className="mt-2">
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Start Time */}
          <div className="sm:col-span-3">
            <label htmlFor="start_time" className="block text-sm font-medium leading-6 text-gray-900">
              Start Time
            </label>
            <div className="mt-2">
              <input
                type="datetime-local"
                name="start_time"
                id="start_time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Time will be stored as entered</p>
          </div>

          {/* Duration */}
          <div className="sm:col-span-3">
            <label htmlFor="duration_minutes" className="block text-sm font-medium leading-6 text-gray-900">
              Duration (minutes)
            </label>
            <div className="mt-2">
              <input
                type="number"
                name="duration_minutes"
                id="duration_minutes"
                required
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="col-span-full">
            <label htmlFor="cover_image" className="block text-sm font-medium leading-6 text-gray-900">
              Cover Image
            </label>
            <div className="mt-2">
              <input
                type="file"
                name="cover_image"
                id="cover_image"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 px-3 py-2"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="max-w-xs h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Upload an image or provide a URL below
            </p>
          </div>

          {/* Cover Image URL (alternative) */}
          <div className="col-span-full">
            <label htmlFor="cover_image_url" className="block text-sm font-medium leading-6 text-gray-900">
              Or Enter Image URL
            </label>
            <div className="mt-2">
              <input
                type="url"
                name="cover_image_url"
                id="cover_image_url"
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Clues Count */}
          <div className="sm:col-span-3">
            <label htmlFor="clues_count" className="block text-sm font-medium leading-6 text-gray-900">
              Number of Clues
            </label>
            <div className="mt-2">
              <input
                type="number"
                name="clues_count"
                id="clues_count"
                required
                value={formData.clues_count}
                onChange={(e) => setFormData({ ...formData, clues_count: parseInt(e.target.value) })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Status - Only show when editing existing hunt */}
          {hunt && (
            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                Status
              </label>
              <div className="mt-2">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}

          {/* Prizes */}
          <div className="col-span-full">
            <h3 className="text-base font-semibold leading-7 text-gray-900">Prizes</h3>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="prize_first" className="block text-sm font-medium leading-6 text-gray-900">
              1st Prize
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="prize_first"
                id="prize_first"
                value={formData.prize_first}
                onChange={(e) => setFormData({ ...formData, prize_first: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="prize_second" className="block text-sm font-medium leading-6 text-gray-900">
              2nd Prize
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="prize_second"
                id="prize_second"
                value={formData.prize_second}
                onChange={(e) => setFormData({ ...formData, prize_second: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="prize_third" className="block text-sm font-medium leading-6 text-gray-900">
              3rd Prize
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="prize_third"
                id="prize_third"
                value={formData.prize_third}
                onChange={(e) => setFormData({ ...formData, prize_third: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-semibold leading-6 text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploadingImage}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isUploadingImage ? 'Uploading image...' : isSubmitting ? 'Saving...' : hunt ? 'Update Hunt' : 'Create Hunt'}
        </button>
      </div>
    </form>
  )
}
