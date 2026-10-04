import type { ReactNode } from 'react'
import RequireAuth from '@/auth/RequireAuth.tsx'

// 이 폴더((protected)) 아래의 화면은 모두 로그인이 필요합니다. 폴더 이름의 괄호는 주소에 나타나지 않습니다.
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
