# s-r 템플릿 (Spring Boot + React)

로그인, 회원가입, 랜딩 페이지가 준비된 기본 프로젝트 템플릿입니다. `/s-r-setup` 스킬이 이 폴더를 새 프로젝트로 복사합니다.

## 구성

| 구분 | 기술 |
| --- | --- |
| backend | Spring Boot 3.5, Java 21, Gradle, Spring Security, JWT (jjwt), JPA |
| frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| db | PostgreSQL 17 |
| 실행 | Docker Compose |

## 바로 실행 (Docker Compose)

```bash
cp .env.example .env   # 필요 시 값 수정 (특히 JWT_SECRET)
docker compose up --build
```

- 프론트엔드: http://localhost:3000 (nginx 가 `/api` 를 백엔드로 프록시)
- 백엔드: http://localhost:8080 (`/actuator/health`)

## 로컬 개발

```bash
# 1) DB 만 컨테이너로
docker compose up -d db

# 2) 백엔드 (http://localhost:8080)
cd backend && ./gradlew bootRun

# 3) 프론트엔드 (http://localhost:5173, /api 는 8080 으로 프록시)
cd frontend && npm install && npm run dev
```

## 검증 명령

```bash
cd backend && ./gradlew test        # H2 메모리 DB로 인증 API 통합 테스트
cd frontend && npm run lint && npm run build
```

## API

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | - | 회원가입 `{ email, password, name }` → 201 |
| POST | `/api/auth/login` | - | 로그인 `{ email, password }` → `{ accessToken, tokenType, expiresIn, user }` |
| GET | `/api/users/me` | Bearer | 내 정보 |
| GET | `/actuator/health` | - | 헬스 체크 |

에러 응답은 모두 `{ status, message, errors, timestamp }` 형식입니다 (`errors` 는 필드별 검증 메시지).

## 구조

```
backend/src/main/java/com/example/app/
├── auth/        # 회원가입·로그인 (AuthController, AuthService, dto)
├── user/        # User 엔티티, 저장소, /api/users/me
├── security/    # JWT 발급·검증, 인증 필터, UserDetailsService
├── config/      # SecurityConfig, CORS 설정
└── common/      # ApiException, 전역 예외 처리

frontend/src/
├── api/         # fetch 래퍼(client.ts), 인증 API
├── auth/        # AuthContext(토큰 보관, 사용자 복원), ProtectedRoute
├── components/  # Layout(헤더/푸터), FormField
└── pages/       # Landing, Login, Signup, Dashboard(보호됨), NotFound
```

## 새 기능을 추가할 때

- 백엔드: 도메인별 패키지(`com.example.app.<도메인>`)를 만들고 Controller → Service → Repository 순으로 둡니다. 인증이 필요 없는 경로는 `SecurityConfig` 의 `permitAll` 에 추가합니다.
- 프론트엔드: API 호출은 `src/api/<도메인>.ts` 에 두고 `api()` 래퍼를 사용합니다 (토큰 자동 첨부). 로그인이 필요한 페이지는 `App.tsx` 에서 `ProtectedRoute` 아래에 둡니다.

## 참고

- 액세스 토큰만 사용하며 `localStorage` 에 저장합니다. 리프레시 토큰은 포함하지 않았습니다.
- 스키마는 `JPA_DDL_AUTO=update` 로 자동 생성됩니다. 운영 전에는 Flyway 같은 마이그레이션 도구로 바꾸는 것을 권장합니다.
- 패키지명 `com.example.app` 과 프로젝트명 `app` 은 스킬이 프로젝트 생성 시 바꿀 자리입니다.
