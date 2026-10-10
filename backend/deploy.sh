#!/bin/bash
set -e

echo "Deploying HRIS application..."

# Enter maintenance mode
php artisan down || true

# Update codebase
git pull origin main

# Install dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader

# Clear caches
php artisan optimize:clear

# Run migrations
php artisan migrate --force

# Cache config and routes
php artisan optimize

# Exit maintenance mode
php artisan up

echo "Deployment finished!"
