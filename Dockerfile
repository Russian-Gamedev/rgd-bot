# Stage 1: Base image
FROM node:20-alpine as base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json .
COPY src src

# Stage 2: Install prod dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# Stage 3: Install dev dependencies & build
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm run build

# Stage 4: Production Environment
FROM base as production

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

CMD [ "node", "build/index.js" ]