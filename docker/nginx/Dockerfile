# ==========================================
# Stage 1: Build React SPA
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY frontend/package*.json ./
RUN npm install

# Copy source code and config
COPY frontend/ ./

# Compile frontend for production (reads .env.production)
RUN npm run build

# ==========================================
# Stage 2: Nginx Web Server
# ==========================================
FROM nginx:alpine

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy compiled frontend from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
