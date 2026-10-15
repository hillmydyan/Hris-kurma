#!/bin/bash
set -e

echo "=== Memulai Deploy HRIS (All-in-One Container) ==="

# 1. Update kode terbaru dari git
echo ">> Menarik update git..."
git pull origin main || true

# 2. Build image tunggal (React + Laravel + Nginx + Worker)
echo ">> Membangun All-in-One Docker container..."
docker compose build hris

# 3. Jalankan container
echo ">> Menjalankan service..."
docker compose up -d

# 4. Tunggu container siap
sleep 3

# 5. Jalankan migrasi database
echo ">> Menjalankan migrasi database..."
docker compose exec -T hris php artisan migrate --force

# 6. Optimasi cache Laravel
echo ">> Membersihkan dan memperbarui cache..."
docker compose exec -T hris php artisan optimize:clear
docker compose exec -T hris php artisan optimize

echo "=== Selesai! HRIS aktif dalam 1 container (hris-app) di Port 8085 ==="
