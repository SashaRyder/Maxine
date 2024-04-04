FROM oven/bun:alpine as final
WORKDIR /usr/src/app

# Set environment variables
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NICKNAME=Maxine

# Install additional packages
RUN apk add python3 ffmpeg yt-dlp --no-cache

# Copy application code
COPY . .

# Install dependencies
RUN bun install

# Set volume and default command
VOLUME [ "/data" ]
CMD [ "bun", "run", "app.ts" ]
