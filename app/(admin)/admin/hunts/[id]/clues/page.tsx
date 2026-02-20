import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Database } from '@/lib/types/database'
import DeleteClueButton from '@/components/admin/DeleteClueButton'

type Hunt = Database['public']['Tables']['hunts']['Row']
type Clue = Database['public']['Tables']['clues']['Row']

export default async function CluesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Get hunt details
  const { data: hunt } = await supabase
    .from('hunts')
    .select('*')
    .eq('id', id)
    .single<Hunt>()

  if (!hunt) {
    notFound()
  }

  // Get clues for this hunt
  const { data: clues } = await supabase
    .from('clues')
    .select('*')
    .eq('hunt_id', id)
    .order('clue_number', { ascending: true })

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href="/admin/hunts"
          className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block"
        >
          ← Back to Hunts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{hunt.title} - Clues</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage clues for this scavenger hunt. You specified {hunt.clues_count} clues for this hunt.
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <Link
          href={`/admin/hunts/${id}/clues/new`}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Add Clue
        </Link>
      </div>

      {clues && clues.length > 0 ? (
        <div className="space-y-4">
          {(clues as Clue[]).map((clue) => (
            <div
              key={clue.id}
              className="bg-white shadow rounded-lg p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-800">
                      Clue {clue.clue_number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {clue.clue_text}
                  </h3>
                  {clue.hint_text && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Hint:</span> {clue.hint_text}
                    </p>
                  )}
                  {clue.location_hint && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Location:</span> {clue.location_hint}
                    </p>
                  )}
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Criterion:</span>{' '}
                      {typeof clue.correct_answer_criteria === 'string'
                        ? clue.correct_answer_criteria
                        : (clue.correct_answer_criteria as { keywords?: string[] })?.keywords?.join(', ') || JSON.stringify(clue.correct_answer_criteria)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 ml-4">
                  <Link
                    href={`/admin/hunts/${id}/clues/${clue.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <DeleteClueButton
                    clueId={clue.id}
                    huntId={id}
                    clueNumber={clue.clue_number}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clues</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new clue for this hunt.
          </p>
          <div className="mt-6">
            <Link
              href={`/admin/hunts/${id}/clues/new`}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Add First Clue
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
