'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/auth/AuthContext.tsx'

// 브라우저에서만 동작하는 전역 상태(로그인 등)를 여기서 감쌉니다. layout.tsx 는 서버 컴포넌트로 둡니다.
export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
