FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
# /api 프록시(next.config.ts 의 rewrites) 대상은 빌드할 때 고정됩니다. Compose 안에서는 서비스 이름으로 찾습니다.
ARG API_PROXY_TARGET=http://backend:8080
ENV API_PROXY_TARGET=$API_PROXY_TARGET
# @addon:next-docker-env
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# standalone 결과물은 필요한 node_modules 를 포함합니다. 정적 파일(.next/static, public)은 따로 복사합니다.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
