# Stage 1: Base image
FROM oven/bun:alpine as base

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY tsconfig.json .
COPY src src

# Stage 2: Production Environment
FROM base as production

RUN apk add --no-cache tini

RUN bun install --frozen-lockfile --production --ignore-scripts

ENV NODE_ENV="production"

ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "bun", "src/index.ts" ]