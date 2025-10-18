FROM oven/bun:alpine AS base

WORKDIR /app

FROM base AS builder

# Accept build arguments for git information
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT=unknown

COPY package.json bun.lock ./

RUN bun install

COPY . .

# Check if build works
RUN bun run build

FROM base AS production

RUN apk add --no-cache tini

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/assets ./assets

# Set git information as environment variables
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT=unknown
ENV GIT_BRANCH=$GIT_BRANCH
ENV GIT_COMMIT=$GIT_COMMIT

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun","./src/main.ts"]