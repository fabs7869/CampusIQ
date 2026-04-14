#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
# Note: We are in the root directory here, but alembic.ini is in backend/
cd backend
alembic upgrade head

# The start command is handled by the Procfile or Render setting, 
# but migrations are now complete.
