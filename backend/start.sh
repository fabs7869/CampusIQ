#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies if needed (already handled by buildCommand, but safe here)
pip install -r backend/requirements.txt

# Run migrations
cd backend
alembic upgrade head

# Note: The actual process management (Celery & Gunicorn) 
# is handled by the render.yaml startCommand to ensure 
# Render correctly monitors the main process.
