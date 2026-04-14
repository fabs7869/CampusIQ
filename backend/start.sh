#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🚀 Starting Database Initialization..."

# Run migrations
cd backend
echo "Running migrations..."
alembic upgrade head

echo "Seeding initial users..."
python scripts/init_users.py

echo "✅ Database Initialization Complete!"
