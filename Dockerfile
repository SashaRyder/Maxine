# Stage 1: Dependencies
FROM debian:bullseye-slim as deps

# Install required dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl xz-utils ca-certificates \
    && curl -s -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp --create-dirs -o /deps/yt-dlp \
    && curl -s -L https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz | tar -xJ -C /tmp \
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
    && apt-get install -y --no-install-recommends python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . .

# Install dependencies
RUN bun install

# Set volume and default command
VOLUME [ "/data" ]
CMD [ "bun", "run", "app.ts" ]
