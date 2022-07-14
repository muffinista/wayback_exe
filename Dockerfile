FROM node:lts

ENV APP_HOME /app

RUN apt-get update && \
      apt-get install -yq \
              ca-certificates \
              fonts-liberation \
              gconf-service \
              imagemagick \
              libappindicator1 \
              libasound2 \
              libatk1.0-0 \
              libc6 \
              libcairo2 \
              libcups2 \
              libdbus-1-3 \
              libexpat1 \
              libfontconfig1 \
              libgbm-dev \
              libgcc1 \
              libgconf-2-4 \
              libgdk-pixbuf2.0-0 \
              libglib2.0-0 \
              libgtk-3-0 \
              libicu-dev \
              libjpeg-dev \
              libnspr4 \
              libnss3 \
              libpango-1.0-0 \
              libpangocairo-1.0-0 \
              libpng-dev \
              libstdc++6 \
              libx11-6 \
              libx11-xcb1 \
              libxcb1 \
              libxcomposite1 \
              libxcursor1 \
              libxdamage1 \
              libxext6 \
              libxfixes3 \
              libxi6 \
              libxrandr2 \
              libxrender1 \
              libxss1 \
              libxtst6 \
              lsb-release \
              wget \
              xdg-utils \
              && \
      apt-get clean && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app

# COPY . /app

ADD package.json ${APP_HOME}/package.json
ADD package-lock.json ${APP_HOME}/package-lock.json
WORKDIR $APP_HOME
RUN npm install
ADD . /app

ENV DEBUG="puppeteer:*"
ENTRYPOINT ["node", "bot.js"]
