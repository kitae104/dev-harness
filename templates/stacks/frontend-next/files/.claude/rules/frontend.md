---
paths:
  - "frontend/**"
---

# 프론트엔드 규칙 (Next.js 16 App Router, React 19, TypeScript, Tailwind v4)

- API 호출은 `src/api/<도메인>.ts` 에 `xxxApi` 객체로 모으고 반드시 `client.ts` 의 `api<T>()` 를 거칩니다. 컴포넌트에서 `fetch` 를 직접 쓰지 않습니다 (토큰, 에러 형식 처리가 여기 있음). 파일 업로드는 `body` 에 `FormData` 를 넘기면 `api()` 가 Content-Type 을 비워 브라우저가 multipart 로 보냅니다.
- 서버 응답 타입은 `src/api/<도메인>.ts` 에 `interface` 로 선언하고 백엔드 응답과 필드 이름(camelCase)을 맞춥니다.
- 에러 표시: `catch (err) { err instanceof ApiError ? err.message : '요청을 처리하지 못했습니다.' }` 를 `<Alert>` 로 보여 줍니다. 필드별 메시지는 `err.errors[필드]` 로 `FormField` 의 `error` 에 넘깁니다 (`src/app/signup/page.tsx` 참고).

## 서버 컴포넌트와 클라이언트 컴포넌트
- App Router 의 파일은 기본이 서버 컴포넌트입니다. `useAuth()`, `useState`/`useEffect`, `onClick` 같은 이벤트, `useRouter`/`usePathname`/`useSearchParams` 를 쓰는 파일은 맨 위에 `'use client'` 를 둡니다.
- **API 호출은 클라이언트 컴포넌트에서만 합니다.** 액세스 토큰이 브라우저 `localStorage` 에 있어서 서버(서버 컴포넌트, Route Handler, Server Action)는 토큰을 모릅니다. 로그인이 필요한 데이터는 `useEffect` 나 이벤트 핸들러에서 `xxxApi` 로 불러옵니다.
- `localStorage`, `window` 는 렌더링 중에 읽지 않고 `useEffect` 안에서만 씁니다 (서버 렌더링 결과와 첫 화면이 달라지면 hydration 오류). 토큰은 `client.ts` 의 `tokenStorage` 만 다룹니다.
- `useSearchParams()` 를 쓰는 컴포넌트는 `<Suspense>` 로 감쌉니다 (`src/app/login/page.tsx` 참고). 안 그러면 `npm run build` 가 실패합니다.
- `layout.tsx`, `not-found.tsx` 처럼 상태가 없는 화면은 서버 컴포넌트로 둡니다. `metadata` 는 서버 컴포넌트에서만 export 할 수 있습니다.

## 화면과 라우팅
- 화면은 `src/app/<경로>/page.tsx`(default export) 입니다. 재사용 UI 는 `src/components/`.
- 로그인이 필요한 화면은 `src/app/(protected)/<경로>/page.tsx` 에 둡니다. `(protected)/layout.tsx` 의 `RequireAuth` 가 로그인하지 않은 사용자를 `/login?next=<경로>` 로 보내고, 로그인 후 그 경로로 돌아옵니다. 괄호 폴더 이름은 주소에 나타나지 않습니다.
- 헤더 메뉴는 `src/components/SiteHeader.tsx` 에 `<NavLink href="/경로">이름</NavLink>` 로 추가합니다 (지금 경로이면 자동 강조).
- 페이지 이동은 `next/link` 의 `<Link href>` 와 `next/navigation` 의 `useRouter()` 를 씁니다 (`react-router-dom` 은 없음). 링크를 버튼 모양으로: `<Link href="/x" className={buttonClass({ variant: 'outline' })}>`.
- 로그인 사용자: `useAuth()` (`auth/AuthContext.tsx`). 토큰을 직접 다루지 않습니다. 토큰 만료(401)는 `client.ts` 가 토큰을 지우고 `AuthContext` 가 로그아웃 상태로 바꾸므로 페이지에서 따로 처리하지 않습니다. 첫 화면에서는 `loading` 이 `true` 이고 브라우저에서 토큰을 확인한 뒤 `false` 가 됩니다.

## 설정과 프록시
- 브라우저에서는 같은 출처의 `/api/...` 로 요청하고, Next 서버가 `next.config.ts` 의 `rewrites` 로 백엔드에 넘깁니다. 대상은 `API_PROXY_TARGET` (기본 `http://localhost:8080`).
- 새 백엔드 서비스로 가는 경로는 `rewrites` 의 `/api/:path*` 규칙 **앞에** 더 구체적인 규칙을 추가합니다. 대상 주소는 환경 변수로 받고, Docker 빌드에서 쓸 값은 `Dockerfile` 의 `ARG`/`ENV` 로 넘깁니다 (`output: 'standalone'` 에서는 rewrites 가 빌드할 때 고정되므로 실행 시 환경 변수로는 바뀌지 않습니다).
- 브라우저 코드에서 읽는 환경 변수는 `NEXT_PUBLIC_` 으로 시작해야 하고 빌드할 때 코드에 들어갑니다. 비밀값을 `NEXT_PUBLIC_` 으로 두지 않습니다. 새 변수는 `.env.example` 에도 추가합니다 (로컬 값은 `.env.local`).
- `next/font/google` 처럼 빌드 때 인터넷이 필요한 기능은 쓰지 않습니다. 글꼴은 `src/app/layout.tsx` 의 `<head>` 에 `<link>` 로 넣습니다 (`.claude/rules/design.md`).

## 스타일과 기타
- 스타일은 디자인 규칙(`.claude/rules/design.md`)을 따릅니다: 버튼·카드·입력은 `components/ui/` 를 쓰고, 색은 토큰 클래스(`bg-primary`, `text-muted-foreground`, `border-border` …)만 씁니다.
- 서비스 이름과 소개 문구는 `src/config/site.ts` 에서 가져옵니다.
- 화면 문구는 한국어.
- import 경로에 확장자(`.tsx`, `.ts`)를 붙입니다 (기존 코드와 동일). `src/` 아래는 `@/` 별칭으로 가져옵니다: `import Card from '@/components/ui/Card.tsx'`.
- 단위 테스트가 필요하면(순수 계산 함수, 훅 등) vitest 를 추가하고 `package.json` 에 `"test": "vitest run"` 스크립트를 둡니다. 종료 훅과 `/verify` 가 `test` 스크립트가 있으면 함께 돌립니다. 테스트 파일은 대상 옆에 `*.test.ts`.
- 검증: `cd frontend && npm run lint && npm run build` (`next build` 가 타입 검사까지 합니다)

## 새 도메인 추가

1. `src/api/<도메인>.ts`: 응답 `interface` + `xxxApi` (모두 `api<T>()` 사용)
2. `src/app/(protected)/<경로>/page.tsx` (목록), 필요하면 `<경로>/new/page.tsx`, `<경로>/[id]/page.tsx`. 맨 위에 `'use client'` 를 두고 `useEffect` 에서 `xxxApi` 로 불러옵니다. 목록·상세는 `Card`, 폼은 `FormField`·`Button`·`Alert` 를 씁니다. 동적 경로의 값은 `useParams()` 로 읽습니다.
3. `src/components/SiteHeader.tsx` 의 로그인 메뉴(대시보드 옆)에 `<NavLink href="/<경로>">이름</NavLink>`
4. `cd frontend && npm run lint && npm run build` 통과 확인
