import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PeriodiQ - App',
  description: 'Unisciti a entusiasmanti cacce al tesoro ed esplora il mondo intorno a te.',
  icons: {
    icon: '/Favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
