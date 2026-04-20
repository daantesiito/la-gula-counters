import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'La Gula Counters',
  description: 'OBS overlays and moderator control panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
