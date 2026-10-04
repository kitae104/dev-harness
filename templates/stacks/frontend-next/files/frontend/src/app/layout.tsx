import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import SiteFooter from '@/components/SiteFooter.tsx'
import SiteHeader from '@/components/SiteHeader.tsx'
import { site } from '@/config/site.ts'
import Providers from './providers.tsx'
import './globals.css'

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>{/* 웹 글꼴을 쓰려면 여기에 <link> 를 두고 styles/theme.css 의 --font-body 등을 함께 바꿉니다. */}</head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}
