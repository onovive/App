import { createServerSupabaseClient } from '@/lib/supabase/server'
import ClueForm from '@/components/admin/ClueForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Database } from '@/lib/types/database'

type Clue = Database['public']['Tables']['clues']['Row']

export default async function EditCluePage({
  params,
}: {
  params: Promise<{ id: string; clueId: string }>
}) {
  const { id, clueId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: clue } = await supabase
    .from('clues')
    .select('*')
    .eq('id', clueId)
    .single<Clue>()

  if (!clue) {
    notFound()
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href={`/admin/hunts/${id}/clues`}
          className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block"
        >
          ← Back to Clues
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Clue #{clue.clue_number}</h1>
      </div>
      <ClueForm huntId={id} clue={clue} />
    </div>
  )
}
