#!/bin/bash
set -e

echo "=== Memulai Deploy HRIS (All-in-One Container) ==="

# 1. Update kode terbaru dari git
echo ">> Menarik update git..."
git pull origin main || true

# 2. Sinkronkan .env dari backend ke root untuk docker-compose
if [ -f backend/.env ]; then
    cp backend/.env .env
fi

# 2. Build image tunggal (React + Laravel + Nginx + Worker)
echo ">> Membangun All-in-One Docker container..."
docker compose build hris

# 3. Jalankan container
echo ">> Menjalankan service..."
docker compose up -d

# 4. Tunggu database MySQL benar-benar siap menerima koneksi dari Laravel
echo ">> Menunggu database siap..."
sleep 5
until docker compose exec -T db mysqladmin ping -h "localhost" --silent; do
    echo "Menunggu inisialisasi MySQL..."
    sleep 2
done
# Beri jeda 3 detik untuk transisi startup final MySQL
sleep 3
echo ">> Database siap!"

# 5. Jalankan migrasi database
echo ">> Menjalankan migrasi database..."
docker compose exec -T hris php artisan migrate --force

# 6. Optimasi cache Laravel
echo ">> Membersihkan dan memperbarui cache..."
docker compose exec -T hris php artisan optimize:clear
docker compose exec -T hris php artisan optimize

echo "=== Selesai! HRIS aktif dalam 1 container (hris-app) di Port 8085 ==="
