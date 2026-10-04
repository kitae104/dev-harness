import type { NextConfig } from 'next'

// /api 요청을 보낼 백엔드. npm run dev 는 시작할 때, next build 는 빌드할 때 읽습니다.
// standalone 빌드에서는 rewrites 가 빌드 시점에 고정되므로 Docker 에서는 Dockerfile 의 빌드 인자(ARG)로 넘깁니다.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

const nextConfig: NextConfig = {
  // Docker 이미지용: node_modules 없이 server.js 로 실행되는 최소 결과물(.next/standalone)을 만듭니다.
  output: 'standalone',
  experimental: {
    // rewrites 프록시의 응답 대기 시간(ms). 기본 30초는 AI 응답처럼 느린 요청에 짧아서 5분으로 늘립니다.
    proxyTimeout: 300_000,
  },
  async rewrites() {
    return [
      // 더 구체적인 경로(/api/py/... 등)를 /api 보다 먼저 둡니다.
      // @addon:next-rewrites
      { source: '/api/:path*', destination: `${API_PROXY_TARGET}/api/:path*` },
    ]
  },
}

export default nextConfig
