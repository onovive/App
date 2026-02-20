import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeleteHuntButton from '@/components/admin/DeleteHuntButton'
import DuplicateHuntButton from '@/components/admin/DuplicateHuntButton'
import HuntStatusDropdown from '@/components/admin/HuntStatusDropdown'
import AnnounceHuntButton from '@/components/admin/AnnounceHuntButton'
import { Database } from '@/lib/types/database'

// Revalidate every 30 seconds for better performance
export const revalidate = 30

type Hunt = Database['public']['Tables']['hunts']['Row']

export default async function HuntsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: hunts } = await supabase
    .from('hunts')
    .select('id, title, status, start_time, clues_count, created_at')
    .order('start_time', { ascending: false })

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Hunts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all scavenger hunts including creating new ones and editing existing hunts.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/hunts/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Create Hunt
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Start Time
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Clues
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {(hunts as Hunt[])?.map((hunt) => {
                    return (
                      <tr key={hunt.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {hunt.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <HuntStatusDropdown huntId={hunt.id} currentStatus={hunt.status} />
                        </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {hunt.start_time.replace('T', ' ').substring(0, 16)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {hunt.clues_count} clues
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {hunt.created_at.split('T')[0]}
                      </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                          <AnnounceHuntButton huntId={hunt.id} huntTitle={hunt.title} />
                          <Link
                            href={`/admin/hunts/${hunt.id}/participants`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Participants
                          </Link>
                          <Link
                            href={`/admin/hunts/${hunt.id}/clues`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Clues
                          </Link>
                          <Link
                            href={`/admin/hunts/${hunt.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <DuplicateHuntButton huntId={hunt.id} />
                          <DeleteHuntButton huntId={hunt.id} huntTitle={hunt.title} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
