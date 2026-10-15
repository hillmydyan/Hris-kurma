# ========================================================
# HRIS KURMA GROUP - ALL-IN-ONE PRODUCTION DOCKERFILE
# Menggabungkan React Frontend + Laravel Backend + Nginx +
# PHP-FPM + Queue Worker + Scheduler dalam 1 Container Tunggal
# ========================================================

# --- Stage 1: Build React SPA Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Main Production Container ---
FROM php:8.2-fpm-alpine

# Install System Packages & Nginx & Supervisor
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    mariadb-client \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    libxml2-dev \
    icu-dev \
    shadow

# Install Required PHP Extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy PHP Configuration
COPY docker/php/local.ini $PHP_INI_DIR/conf.d/local.ini

# Copy Nginx Configuration
RUN rm -rf /etc/nginx/conf.d/* /etc/nginx/http.d/*
COPY docker/nginx/nginx-allinone.conf /etc/nginx/http.d/default.conf

# Copy Supervisor Configuration
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf

# Copy React Frontend Assets from Stage 1
COPY --from=frontend-builder /app/dist /var/www/frontend

# Setup Laravel Backend
WORKDIR /var/www/backend
COPY backend/ ./

# Install Composer Dependencies (Production)
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Setup Storage & Cache Permissions
RUN mkdir -p /var/www/backend/storage/framework/cache/data \
             /var/www/backend/storage/framework/sessions \
             /var/www/backend/storage/framework/views \
             /var/www/backend/storage/logs \
             /var/www/backend/storage/app/public \
             /var/www/backend/bootstrap/cache \
    && chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache \
    && chmod -R 775 /var/www/backend/storage /var/www/backend/bootstrap/cache \
    && php artisan storage:link || true

# Entrypoint script for startup
COPY docker/php/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
