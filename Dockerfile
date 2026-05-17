# ─── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production=false
COPY frontend/ .
RUN npm run build

# ─── Stage 2: Backend + serve frontend ────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into backend's static folder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "backend/server.js"]
