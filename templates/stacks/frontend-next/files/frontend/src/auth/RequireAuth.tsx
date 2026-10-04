'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext.tsx'

// 로그인이 필요한 화면을 감쌉니다. src/app/(protected)/layout.tsx 에서 씁니다.
// 로그인하지 않았으면 /login?next=<지금 경로> 로 보내고, 로그인 후 그 경로로 돌아옵니다.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [loading, user, pathname, router])

  if (loading) {
    return <p className="py-20 text-center text-muted-foreground">불러오는 중...</p>
  }
  if (!user) {
    return null
  }
  return <>{children}</>
}
