import Link from 'next/link'
import { linkClass } from '@/components/ui/styles.ts'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-5xl font-bold text-muted-foreground/50">404</p>
      <p className="mt-4 text-muted-foreground">페이지를 찾을 수 없습니다.</p>
      <Link href="/" className={`mt-6 inline-block ${linkClass}`}>
        홈으로
      </Link>
    </div>
  )
}
