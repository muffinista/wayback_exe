FROM node:lts

ENV APP_HOME /app
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROME_PATH=/chrome-linux/chrome
ENV PUPPETEER_EXECUTABLE_PATH=/chrome-linux/chrome

RUN mkdir -p /app

# set this to linux-arm64 for M1/M2 chips
ARG PLAYWRIGHT_PLATFORM="linux"

# we'll grab a puppeteer build of chrome based on this build_id:
ARG PLAYWRIGHT_BUILD_ID="1097"

ARG CHROME_DEPS="ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libc6 libcairo2 libcups2 libcurl4 libdbus-1-3 libdrm2 libexpat1 libgbm1 libglib2.0-0 libgtk-4-1 libnspr4 libnss3 libpango-1.0-0 libu2f-udev libvulkan1 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 wget xdg-utils"

RUN apt-get update \
    && apt-get install -y wget gnupg unzip ghostscript \
    && apt-get update \
    && apt-get install -y ${CHROME_DEPS} fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 cmake \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
      && cd / \
    && wget -O chromium-$PLAYWRIGHT_PLATFORM.zip "https://playwright.azureedge.net/builds/chromium/$PLAYWRIGHT_BUILD_ID/chromium-$PLAYWRIGHT_PLATFORM.zip" \
    && unzip chromium-$PLAYWRIGHT_PLATFORM.zip \
    && rm -f ./chromium-$PLAYWRIGHT_PLATFORM.zip

# RUN apt-get update && \
#       apt-get install -yq \
#               ca-certificates \
#               fonts-liberation \
#               gconf-service \
#               imagemagick \
#               libappindicator1 \
#               libasound2 \
#               libatk1.0-0 \
#               libc6 \
#               libcairo2 \
#               libcups2 \
#               libdbus-1-3 \
#               libexpat1 \
#               libfontconfig1 \
#               libgbm-dev \
#               libgcc1 \
#               libgconf-2-4 \
#               libgdk-pixbuf2.0-0 \
#               libglib2.0-0 \
#               libgtk-3-0 \
#               libicu-dev \
#               libjpeg-dev \
#               libnspr4 \
#               libnss3 \
#               libpango-1.0-0 \
#               libpangocairo-1.0-0 \
#               libpng-dev \
#               libstdc++6 \
#               libx11-6 \
#               libx11-xcb1 \
#               libxcb1 \
#               libxcomposite1 \
#               libxcursor1 \
#               libxdamage1 \
#               libxext6 \
#               libxfixes3 \
#               libxi6 \
#               libxrandr2 \
#               libxrender1 \
#               libxss1 \
#               libxtst6 \
#               lsb-release \
#               wget \
#               xdg-utils \
#               && \
#       apt-get clean && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*


# COPY . /app

ADD package.json ${APP_HOME}/package.json
ADD package-lock.json ${APP_HOME}/package-lock.json
WORKDIR $APP_HOME
RUN npm install
ADD . /app

#ENV DEBUG="puppeteer:*"
ENTRYPOINT ["node", "bot.js"]
