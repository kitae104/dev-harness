'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn.ts'

interface Props {
  href: string
  children: ReactNode
}

// 헤더 메뉴 링크. 지금 경로(하위 경로 포함)이면 강조합니다.
export default function NavLink({ href, children }: Props) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
    >
      {children}
    </Link>
  )
}
