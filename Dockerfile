FROM ubuntu:22.04

ENV NICKNAME=daisy
ENV YOUTUBE_DL_SKIP_DOWNLOAD true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PATH="/usr/bin/python2:/usr/bin/python:${PATH}"

WORKDIR /usr/src/app
COPY ./package.json ./yarn.lock ./

RUN apt-get update \
    && apt-get install curl libnss3-dev wget python2 handbrake-cli gnupg xz-utils -y \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install nodejs \
    && npm install -g yarn \
    && ln -s /usr/bin/python2 /usr/bin/python \
    && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install google-chrome-stable -y --no-install-recommends \
    && yarn install
    
COPY . .

RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp && \
    chmod +x yt-dlp && \
    wget https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz && \
    tar -xf ffmpeg-master-latest-linux64-gpl.tar.xz && \
    mv ffmpeg-master-latest-linux64-gpl/bin/ff* /usr/bin && \
    rm -rf ffmpeg-master-latest-linux64-gpl && \
    chmod +x /usr/bin/ff* && \
    mv yt-dlp /usr/bin && \
    rm -rf /usr/src/app/build && \
    yarn build && \
    yarn install --production

WORKDIR /usr/src/app/build


CMD [ "node", "app.js" ]
