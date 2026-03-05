FROM node:22-slim

RUN apt-get update && apt-get install -y \
    fonts-noto fonts-dejavu poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Only copy compiled JS, not TS source
COPY lib ./lib

EXPOSE 8080
CMD ["node", "lib/index.js"]