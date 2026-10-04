import { type FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../api/client.ts'
import { pyApi, type PyUser, type TextStats } from '../api/py.ts'
import { cn } from '../lib/cn.ts'
import Button from './ui/Button.tsx'
import Input from './ui/Input.tsx'
import { cardClass } from './ui/styles.ts'

// FastAPI 서비스 연결 확인용 카드. 실제 기능을 만들면 지워도 됩니다.
export default function PyServiceCard() {
  const [pyUser, setPyUser] = useState<PyUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [stats, setStats] = useState<TextStats | null>(null)

  useEffect(() => {
    pyApi
      .me()
      .then(setPyUser)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'FastAPI 서비스에 연결하지 못했습니다.'))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setStats(await pyApi.analyze(text))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '요청을 처리하지 못했습니다.')
    }
  }

  return (
    <section className={cn(cardClass, 'mt-8 max-w-lg p-6 text-sm')}>
      <h2 className="font-semibold">FastAPI 서비스</h2>
      <p className="mt-1 text-muted-foreground">
        {pyUser ? `같은 토큰으로 인증됨: ${pyUser.email} (${pyUser.role})` : error ? error : '연결 확인 중…'}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          className="flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="분석할 문장"
        />
        <Button type="submit" disabled={!text.trim()}>
          분석
        </Button>
      </form>
      {stats && (
        <p className="mt-3 text-foreground">
          글자 {stats.characters} · 단어 {stats.words} · 줄 {stats.lines}
        </p>
      )}
    </section>
  )
}
