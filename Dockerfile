FROM node:16-bullseye-slim as base
RUN npm install -g pnpm

FROM base as deps
RUN mkdir /app
WORKDIR /app
ADD package.json pnpm-lock.yaml ./
RUN pnpm install

FROM base as production-deps
RUN mkdir /app
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD package.json pnpm-lock.yaml ./
RUN pnpm prune --prod --config.ignore-scripts=true

FROM base as build
ENV NODE_ENV=production
RUN mkdir /app
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN pnpm run build

FROM base
ENV NODE_ENV=production
RUN mkdir /app
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/private /app/private
COPY --from=build /app/public /app/public
ADD . .

CMD ["pnpm", "run", "start"]
