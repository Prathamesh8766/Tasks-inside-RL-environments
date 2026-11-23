
FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

WORKDIR /workspace/toon
RUN git init \
    && git remote add origin https://github.com/toon-format/toon.git \
    && git fetch --depth 1 origin 22caca377f08d737789a2ca60ab02c425a3aa947 \
    && git checkout FETCH_HEAD

RUN pnpm install --filter './packages/**' --frozen-lockfile --network-concurrency=4 \
    && pnpm build

CMD ["bash"]

