'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ClueFormProps {
  huntId: string
  clue?: {
    id: string
    clue_number: number
    clue_text: string
    hint_text: string | null
    correct_answer_criteria: any
    location_hint: string | null
  }
}

export default function ClueForm({ huntId, clue }: ClueFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Support both old format (keywords array) and new format (plain string)
  const getExistingCriterion = () => {
    if (!clue?.correct_answer_criteria) return ''
    if (typeof clue.correct_answer_criteria === 'string') return clue.correct_answer_criteria
    if (Array.isArray(clue.correct_answer_criteria?.keywords)) {
      return clue.correct_answer_criteria.keywords.join(', ')
    }
    return ''
  }

  const [formData, setFormData] = useState({
    clue_number: clue?.clue_number || 1,
    clue_text: clue?.clue_text || '',
    hint_text: clue?.hint_text || '',
    location_hint: clue?.location_hint || '',
    criterion: getExistingCriterion(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const clueData = {
        hunt_id: huntId,
        clue_number: formData.clue_number,
        clue_text: formData.clue_text,
        hint_text: formData.hint_text || null,
        location_hint: formData.location_hint || null,
        correct_answer_criteria: formData.criterion.trim(),
      }

      if (clue) {
        // Update existing clue
        const { error } = await (supabase as any)
          .from('clues')
          .update(clueData)
          .eq('id', clue.id)

        if (error) throw error
        alert('Clue updated successfully!')
      } else {
        // Create new clue
        const { error } = await (supabase as any).from('clues').insert(clueData)

        if (error) throw error
        alert('Clue created successfully!')
      }

      router.push(`/admin/hunts/${huntId}/clues`)
      router.refresh()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2"
    >
      <div className="px-4 py-6 sm:p-8">
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          {/* Clue Number */}
          <div className="sm:col-span-2">
            <label
              htmlFor="clue_number"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Clue Number
            </label>
            <div className="mt-2">
              <input
                type="number"
                name="clue_number"
                id="clue_number"
                required
                min="1"
                value={formData.clue_number}
                onChange={(e) =>
                  setFormData({ ...formData, clue_number: parseInt(e.target.value) })
                }
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Clue Text */}
          <div className="col-span-full">
            <label
              htmlFor="clue_text"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Clue Text
            </label>
            <div className="mt-2">
              <textarea
                id="clue_text"
                name="clue_text"
                rows={3}
                required
                value={formData.clue_text}
                onChange={(e) => setFormData({ ...formData, clue_text: e.target.value })}
                placeholder="Enter the clue that participants will see..."
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Hint Text */}
          <div className="col-span-full">
            <label
              htmlFor="hint_text"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Hint Text (Optional)
            </label>
            <div className="mt-2">
              <textarea
                id="hint_text"
                name="hint_text"
                rows={2}
                value={formData.hint_text}
                onChange={(e) => setFormData({ ...formData, hint_text: e.target.value })}
                placeholder="Enter a hint if participants get stuck..."
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Location Hint */}
          <div className="col-span-full">
            <label
              htmlFor="location_hint"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Location Hint (Optional)
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="location_hint"
                id="location_hint"
                value={formData.location_hint}
                onChange={(e) =>
                  setFormData({ ...formData, location_hint: e.target.value })
                }
                placeholder="e.g., Near the fountain in Central Park"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          {/* Criterion */}
          <div className="col-span-full">
            <label
              htmlFor="criterion"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Criterion
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="criterion"
                id="criterion"
                required
                value={formData.criterion}
                onChange={(e) =>
                  setFormData({ ...formData, criterion: e.target.value })
                }
                placeholder="e.g., remote control, microphone, fountain"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              What should the photo show? AI will check if this object/scene is present in the image.
            </p>
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
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : clue ? 'Update Clue' : 'Create Clue'}
        </button>
      </div>
    </form>
  )
}
