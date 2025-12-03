FROM node:18-bullseye AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:18-bullseye AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend ./

FROM node:18-bullseye
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=backend-builder /app/backend /app/backend
COPY --from=frontend-builder /app/frontend/build /app/frontend/build
# Include compiled contract artifacts for blockchain interactions
COPY blockchain/build /app/blockchain/build

EXPOSE 3001

CMD ["node", "backend/src/server.js"]
