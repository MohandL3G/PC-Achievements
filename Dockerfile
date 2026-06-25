# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /usr/src/app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-slim AS backend-builder
# Install build tools for native modules (sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/backend
COPY backend/package*.json ./
RUN npm install --build-from-source=sqlite3
COPY backend/ ./

# Stage 3: Final Image
FROM node:20-slim
WORKDIR /usr/src/app

# Copy backend files and dependencies
COPY --from=backend-builder /usr/src/app/backend ./

# Copy built frontend assets to the backend's public folder
COPY --from=frontend-builder /usr/src/app/frontend/dist ./public

# Create uploads directory for avatars
RUN mkdir -p /usr/src/app/uploads

# Expose the server port
EXPOSE 5000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:5000,path:'/api/games',timeout:3000},r=>process.exit(r.statusCode>=200?0:1)).on('error',()=>process.exit(1))"

# Start the application
CMD ["node", "server.js"]
