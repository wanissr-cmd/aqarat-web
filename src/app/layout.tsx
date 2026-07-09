import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'نظام عقود الإيجار',
  description: 'نظام إدارة عقود الإيجار العقاري',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
