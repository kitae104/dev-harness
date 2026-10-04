      // '/api' 보다 먼저 두어야 /api/py 요청이 FastAPI 로 갑니다.
      { source: '/api/py/:path*', destination: `${process.env.FASTAPI_PROXY_TARGET ?? 'http://localhost:8000'}/api/py/:path*` },
