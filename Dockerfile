# Stage 1: Dependencies
FROM debian:bullseye-slim as deps

# Install required dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget xz-utils ca-certificates \
    && wget -qO /deps/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && wget -qO- https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz | tar -xJ -C /tmp \
    && wget -qO- https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz | tar -xz -C /tmp \
    && mv /tmp/geckodriver /deps \
    && mv /tmp/ffmpeg*/bin/ff* /deps \
    && chmod +x -R /deps

# Stage 2: Final Image
FROM oven/bun:slim as final

# Set working directory
WORKDIR /usr/src/app

# Set environment variables
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NICKNAME=Maxine

# Copy dependencies from the previous stage
COPY --from=deps /deps/* /usr/bin/

# Install additional packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends handbrake-cli firefox-esr python3 python-is-python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . .

# Install dependencies
RUN bun install

# Set volume and default command
VOLUME [ "/data" ]
CMD [ "bun", "run", "app.ts" ]
