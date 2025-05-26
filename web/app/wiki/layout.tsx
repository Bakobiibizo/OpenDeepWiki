// Server component for metadata
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Repository Wiki - OpenDeepWiki',
  description: 'View detailed documentation for your repository',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="wiki-layout">
      {children}
    </div>
  )
}
