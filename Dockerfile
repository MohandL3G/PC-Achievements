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
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Stage 3: Final Image
FROM node:20-slim
WORKDIR /usr/src/app

# Copy backend files and dependencies
COPY --from=backend-builder /usr/src/app/backend ./

# Copy built frontend assets to the backend's public folder
COPY --from=frontend-builder /usr/src/app/frontend/dist ./public

# Environment variables with defaults
ENV PORT=5000
ENV STEAM_API_KEY=""
ENV STEAM_USER_ID=""
ENV JWT_SECRET="change_this_secret_in_production"
ENV ADMIN_USERNAME="admin"
ENV ADMIN_PASSWORD="password"

# Expose the server port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
