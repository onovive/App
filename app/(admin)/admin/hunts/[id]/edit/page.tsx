import { createServerSupabaseClient } from '@/lib/supabase/server'
import HuntForm from '@/components/admin/HuntForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Database } from '@/lib/types/database'

type Hunt = Database['public']['Tables']['hunts']['Row']

export default async function EditHuntPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: hunt } = await supabase
    .from('hunts')
    .select('*')
    .eq('id', id)
    .single<Hunt>()

  if (!hunt) {
    notFound()
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href="/admin/hunts"
          className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block"
        >
          ← Back to Hunts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Hunt: {hunt.title}</h1>
      </div>
      <HuntForm hunt={hunt} />
    </div>
  )
}
