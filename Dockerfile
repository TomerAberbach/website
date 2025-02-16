# syntax = docker/dockerfile:1

ARG NODE_VERSION=23.7.0
FROM node:${NODE_VERSION} AS node

ARG PNPM_VERSION=10.2.1
RUN npm install -g pnpm@$PNPM_VERSION

# For puppeteer and playwright
RUN apt-get update
RUN apt-get --yes install ca-certificates fonts-liberation libappindicator3-1 \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
  libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget \
  xdg-utils gstreamer1.0-plugins-base libgstreamer-gl1.0-0 \
  libgstreamer-plugins-bad1.0-0 libwoff1 libopus0 libharfbuzz-icu0 libflite1 \
  libenchant-2-2 libsecret-1-0 libhyphen0 libmanette-0.2-0 libx264-dev libvpx7


FROM node AS dependencies
WORKDIR /app
ADD patches patches
ADD package.json pnpm-lock.yaml ./
RUN pnpm install


FROM node AS production-dependencies
WORKDIR /app
COPY --from=dependencies /app /app
RUN pnpm prune --prod --config.ignore-scripts=true
COPY --from=dependencies /root/.cache /root/.cache


FROM node AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=dependencies /root/.cache /root/.cache
ADD . .

# For glyphhanger
RUN apt-get update
RUN apt-get --yes install python3-pip
RUN pip3 install --break-system-packages fonttools[woff]

ENV NODE_ENV=production
RUN pnpm run build


FROM node
WORKDIR /app
COPY --from=production-dependencies /app/node_modules /app/node_modules
COPY --from=production-dependencies /root/.cache /root/.cache
COPY --from=build /app/build /app/build
COPY --from=build /app/private /app/private
COPY --from=build /app/public /app/public
ADD . .
ENV NODE_ENV=production
CMD ["pnpm", "run", "start"]
