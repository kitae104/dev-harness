import type { ReactNode } from 'react'
import { type BadgeTone, badgeClass } from './styles.ts'

interface Props {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

// 상태·판정 표시 (예: 적정 / 주의 / 실패). 색은 토큰(success, warning, destructive …)으로만 정합니다.
export default function Badge({ children, tone = 'neutral', className }: Props) {
  return <span className={badgeClass(tone, className)}>{children}</span>
}
