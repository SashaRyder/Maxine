FROM ubuntu:22.04

RUN groupadd --gid 1000 ubuntu && useradd --uid 1000 --gid ubuntu --shell /bin/bash --create-home ubuntu

RUN apt-get update -qq
RUN apt-get install curl -qq
RUN apt-get install libnss3-dev -qq
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install wget python2 handbrake-cli nodejs -qq
RUN npm install -g yarn
RUN ln -s /usr/bin/python2 /usr/bin/python

ENV YOUTUBE_DL_SKIP_DOWNLOAD true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PATH="/usr/bin/python2:/usr/bin/python:${PATH}"

WORKDIR /usr/src/app

COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock

RUN yarn install

RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends

RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
RUN chmod +x yt-dlp
RUN apt-get install xz-utils -qq
RUN wget https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz
RUN tar -xf ffmpeg-master-latest-linux64-gpl.tar.xz
RUN mv ffmpeg-master-latest-linux64-gpl/bin/ff* /usr/bin
RUN rm -rf ffmpeg-master-latest-linux64-gpl
RUN chmod +x /usr/bin/ff*

COPY . .
RUN mv yt-dlp /usr/bin

RUN rm -rf /usr/src/app/build

RUN yarn build

WORKDIR /usr/src/app/build

RUN chown -R ubuntu:ubuntu /usr/src/app/build

ENV NICKNAME=daisy

CMD [ "node", "app.js" ]
USER ubuntu
