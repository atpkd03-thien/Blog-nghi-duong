import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import SiteShell from './components/site-shell'

export const metadata: Metadata = {
  title: 'Đất nghỉ dưỡng Bảo Lộc',
  description: 'Thông tin đất nghỉ dưỡng, dự án và bất động sản tại Bảo Lộc.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Đất nghỉ dưỡng Bảo Lộc',
    description: 'Thông tin đất nghỉ dưỡng, dự án và bất động sản tại Bảo Lộc.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
