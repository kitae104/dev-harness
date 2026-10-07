frontend/src/
├── app/         # 화면(App Router): layout.tsx(헤더/푸터), page.tsx(랜딩), login, signup, not-found
│   └── (protected)/  # 로그인이 필요한 화면 묶음 (layout.tsx 의 RequireAuth), dashboard
├── api/         # fetch 래퍼(client.ts), 인증 API
├── auth/        # AuthContext(토큰 보관, 사용자 복원), RequireAuth
├── components/  # SiteHeader, SiteFooter, NavLink
│   └── ui/      # Button, Card, Input, FormField, Alert, Badge (디자인 토큰만 사용)
├── config/      # site.ts (서비스 이름, 소개 문구)
└── styles/      # theme.css (디자인 토큰)
