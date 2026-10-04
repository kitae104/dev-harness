'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/auth/AuthContext.tsx'
import NavLink from '@/components/NavLink.tsx'
import Button from '@/components/ui/Button.tsx'
import { buttonClass } from '@/components/ui/styles.ts'
import { site } from '@/config/site.ts'

export default function SiteHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const pendingLogout = useRef(false)

  // 보호된 화면에서 바로 로그아웃하면 RequireAuth 가 로그인 화면으로 보내 버립니다.
  // 홈(/)으로 먼저 이동하고, 이동이 끝나면 로그아웃합니다.
  useEffect(() => {
    if (pendingLogout.current && pathname === '/') {
      pendingLogout.current = false
      logout()
    }
  }, [pathname, logout])

  const handleLogout = () => {
    if (pathname === '/') {
      logout()
      return
    }
    pendingLogout.current = true
    router.push('/')
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-bold text-primary">
          {site.name}
        </Link>
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <NavLink href="/dashboard">대시보드</NavLink>
              {/* @addon:nav-links */}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <NavLink href="/login">로그인</NavLink>
              <Link href="/signup" className={buttonClass({ size: 'sm' })}>
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
