FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production \
    STANDALONE_CLOUD_RUN=1 \
    PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY db.js server.js ./
COPY public ./public

RUN mkdir -p /app/data /app/uploads/images /app/uploads/audio /app/uploads/avatars /app/uploads/rooms

EXPOSE 8080

CMD ["node", "server.js"]
