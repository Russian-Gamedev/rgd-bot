# Stage 1: Base image
FROM node:20-alpine as base
WORKDIR /usr/src/app
COPY package.json tsconfig.json pnpm-lock.yaml ./

# Stage 2: Install dependencies
FROM base as dependencies
RUN apk add --no-cache curl \
    && wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
RUN source /root/.shrc && pnpm install

# Stage 3: Copy source files
FROM dependencies as source
COPY . ./

# Stage 4: Build the application
FROM source as builder
WORKDIR /usr/src/app
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
RUN source /root/.shrc && pnpm run build

# Stage 5: Production Environment
FROM node:20-alpine as production
WORKDIR /usr/src/app
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/build ./build

CMD [ "node", "build/index.js" ]