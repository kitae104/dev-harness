'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type LoginInput, type User } from '../api/auth.ts'
import { ApiError, AUTH_EXPIRED_EVENT, tokenStorage } from '../api/client.ts'

interface AuthState {
  user: User | null
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // 서버 렌더링 결과와 첫 화면이 같도록 항상 loading=true 로 시작하고, 브라우저에서 토큰을 확인한 뒤 풉니다.
  const [loading, setLoading] = useState(true)

  // 새로고침 시 저장된 토큰으로 사용자 정보를 복원합니다.
  useEffect(() => {
    const restore = tokenStorage.get()
      ? authApi
          .me()
          .then(setUser)
          // 토큰이 무효(401)일 때만 지웁니다. 백엔드 재시작 중의 네트워크 오류로 로그아웃되지 않게.
          .catch((e: unknown) => {
            if (e instanceof ApiError && e.status === 401) tokenStorage.clear()
          })
      : Promise.resolve()
    restore.finally(() => setLoading(false))
  }, [])

  // API 가 토큰 만료(401)를 알리면 로그아웃 상태로 바꿉니다. RequireAuth 가 로그인 화면으로 보냅니다.
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const res = await authApi.login(input)
    tokenStorage.set(res.accessToken)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
