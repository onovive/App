import { Database } from '@/lib/types/database'

type HuntStatus = Database['public']['Tables']['hunts']['Row']['status'] | 'cancelled'

export function calculateHuntStatus(
  startTime: string,
  durationMinutes: number
): HuntStatus {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  if (now < start) {
    return 'upcoming'
  } else if (now >= start && now < end) {
    return 'active'
  } else {
    return 'completed'
  }
}

export function getHuntStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'upcoming':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
