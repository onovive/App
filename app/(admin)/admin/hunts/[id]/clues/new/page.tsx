import ClueForm from '@/components/admin/ClueForm'
import Link from 'next/link'

export default async function NewCluePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href={`/admin/hunts/${id}/clues`}
          className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block"
        >
          ← Back to Clues
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Clue</h1>
      </div>
      <ClueForm huntId={id} />
    </div>
  )
}
