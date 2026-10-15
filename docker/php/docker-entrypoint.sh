#!/bin/sh
set -e

# Ensure Laravel storage and bootstrap cache directories exist with correct permissions
mkdir -p /var/www/backend/storage/framework/cache/data \
         /var/www/backend/storage/framework/sessions \
         /var/www/backend/storage/framework/views \
         /var/www/backend/storage/logs \
         /var/www/backend/storage/app/public \
         /var/www/backend/bootstrap/cache

chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache
chmod -R 775 /var/www/backend/storage /var/www/backend/bootstrap/cache

# Create storage symlink if it doesn't exist
if [ ! -L /var/www/backend/public/storage ]; then
    php /var/www/backend/artisan storage:link || true
fi

exec "$@"
