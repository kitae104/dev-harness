'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client.ts'
import { useAuth } from '@/auth/AuthContext.tsx'
import Alert from '@/components/ui/Alert.tsx'
import Button from '@/components/ui/Button.tsx'
import Card from '@/components/ui/Card.tsx'
import FormField from '@/components/ui/FormField.tsx'
import { linkClass } from '@/components/ui/styles.ts'

// 로그인 후 돌아갈 경로. 다른 사이트로 보내지 않도록 이 사이트 안의 경로(/...)만 받습니다.
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const next = safeNext(searchParams.get('next'))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(form)
      router.replace(next)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="이메일"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <FormField
        label="비밀번호"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {error && <Alert>{error}</Alert>}
      <Button type="submit" disabled={submitting} block>
        {submitting ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">로그인</h1>
      <Card className="mt-8">
        {/* useSearchParams 는 Suspense 안에서 써야 정적 빌드가 됩니다. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link href="/signup" className={linkClass}>
          회원가입
        </Link>
      </p>
    </div>
  )
}
