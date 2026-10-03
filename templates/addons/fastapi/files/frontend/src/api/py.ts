import { api } from './client.ts'

// FastAPI 서비스 (/api/py/**). Spring 에서 받은 토큰을 그대로 사용합니다.
export interface PyUser {
  email: string
  role: string
}

export interface TextStats {
  characters: number
  words: number
  lines: number
}

export const pyApi = {
  me: () => api<PyUser>('/api/py/me'),
  analyze: (text: string) => api<TextStats>('/api/py/text/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
}
