FROM debian:bullseye-slim as deps

RUN apt-get update \
    && apt-get install wget xz-utils ca-certificates -y --no-install-recommends \
    && wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -P /deps \
    && wget -qO- https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz | tar -xJ \
    && wget -qO- https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz | tar -xz \
    && mv geckodriver /deps \
    && mv ffmpeg*/bin/ff* /deps \
    && chmod +x -R /deps

FROM node:21.7.1-bullseye-slim as build

ENV YOUTUBE_DL_SKIP_DOWNLOAD true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /app
RUN apt-get update \
    && apt-get install python -y --no-install-recommends
COPY . .
RUN yarn install\
    && yarn build\
    && yarn install --production

FROM node:21.7.1-bullseye-slim as final

ENV NICKNAME=daisy

RUN apt-get update \
    && apt-get install handbrake-cli firefox-esr python3 python-is-python3 -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /deps/* /usr/bin/
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules

VOLUME [ "/data" ]

WORKDIR /app/build

CMD [ "node", "app.js" ]
