FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Only copy compiled JS, not TS source
COPY lib ./lib

EXPOSE 8080
CMD ["node", "lib/index.js"]