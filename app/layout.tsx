import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PeriodiQ - App',
  description: 'Join exciting scavenger hunts and explore the world around you',
  icons: {
    icon: '/LOGO.svg',
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
