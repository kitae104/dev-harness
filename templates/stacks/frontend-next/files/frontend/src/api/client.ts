// 빌드할 때 값이 코드에 들어갑니다 (NEXT_PUBLIC_*). 비워 두면 같은 출처(/api, next.config.ts 의 rewrites 프록시)를 씁니다.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
const TOKEN_KEY = 'accessToken'
export const AUTH_EXPIRED_EVENT = 'auth:expired'

export interface ApiErrorBody {
  status: number
  message: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string>

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.status = body.status
    this.errors = body.errors ?? {}
  }
}

// 토큰은 브라우저의 localStorage 에 둡니다. 서버 렌더링 중(window 없음)에는 토큰이 없는 것으로 봅니다.
const isBrowser = () => typeof window !== 'undefined'

export const tokenStorage = {
  get: () => (isBrowser() ? localStorage.getItem(TOKEN_KEY) : null),
  set: (token: string) => {
    if (isBrowser()) localStorage.setItem(TOKEN_KEY, token)
  },
  clear: () => {
    if (isBrowser()) localStorage.removeItem(TOKEN_KEY)
  },
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = tokenStorage.get()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    // 토큰을 보냈는데 401 이면 만료·무효 토큰: 지우고 AuthContext 에 알려 로그아웃 상태로 만듭니다.
    if (res.status === 401 && token) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    const body = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null
    throw new ApiError({
      status: body?.status ?? res.status,
      message: body?.message || '요청을 처리하지 못했습니다.',
      errors: body?.errors,
    })
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}
