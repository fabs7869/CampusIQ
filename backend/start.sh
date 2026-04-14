#!/usr/bin/env bash
# Exit on error
set -o errexit

# Run migrations
# Note: alembic.ini is in backend/
cd backend
alembic upgrade head

# Note: The actual process management (Celery & Gunicorn) 
# is handled by the render.yaml startCommand to ensure 
# Render correctly monitors the main process.
