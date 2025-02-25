ARG NODE_VERSION=23

FROM node:${NODE_VERSION}-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN --mount=type=secret,id=PGHOST \
    --mount=type=secret,id=PGUSER \
    --mount=type=secret,id=PGDATABASE \
    --mount=type=secret,id=PGPASSWORD \
    --mount=type=secret,id=PGPORT \
    export PGHOST=$(cat /run/secrets/PGHOST) && \
    export PGUSER=$(cat /run/secrets/PGUSER) && \
    export PGDATABASE=$(cat /run/secrets/PGDATABASE) && \
    export PGPASSWORD=$(cat /run/secrets/PGPASSWORD) && \
    export PGPORT=$(cat /run/secrets/PGPORT) && \
    node build_index.js

RUN pnpm run build

FROM caddy:alpine

COPY --from=build /app/build/ /usr/share/caddy/