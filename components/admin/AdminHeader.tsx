'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navigation = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Hunts', href: '/admin/hunts' },
    { name: 'Users', href: '/admin/users' },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <h1 className="text-xl font-bold text-indigo-600">Admin Panel</h1>
            </div>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              My Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <nav className="sm:hidden border-t border-gray-200">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
