backend/
├── app/
│   ├── main.py      # 앱, CORS, 에러 처리, 라우터 등록
│   ├── core/        # config(환경 변수), db(세션), security(비밀번호, JWT, 현재 사용자)
│   ├── common/      # ApiError·에러 형식, 공용 스키마, 검증 메시지
│   ├── auth/        # 회원가입·로그인
│   └── users/       # User 모델, /api/users/me
├── migrations/      # Alembic 마이그레이션
└── tests/
