# 🎓 CampusIQ — Smart Campus Issue & Improvement Platform

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

Developed with ❤️ by **Furquan Saiyed**.

CampusIQ is a production-ready Smart Campus platform that transforms educational institutions by enabling students to report issues with photo proof while faculty and administrators manage resolutions efficiently.

---

## 🏗️ Monorepo Structure

```
CampusIQ/
├── backend/          # FastAPI + PostgreSQL + Redis (Business Logic & API)
├── frontend/         # Next.js 14 Unified Dashboard (Admin & Faculty Portals)
├── mobile/           # React Native (Expo) Student Application
└── docker-compose.yml
```

## 🚀 Deployment Guide

### Frontend (Vercel)
1. Push this repository to **GitHub**.
2. Connect the repository to **Vercel**.
3. Set the **Root Directory** to `frontend`.
4. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your deployed Backend URL (e.g., `https://api.yourdomain.com/api/v1`)
   - `BACKEND_API_URL`: Same as above (used for server-side rewrites)

### Backend
1. Deploy the `backend/` directory to a Python-capable host (Railway, Render, or a VPS).
2. Configure your PostgreSQL and Redis instances.
3. Update `BACKEND_CORS_ORIGINS` in your `.env` to include your Vercel URL.

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL & Redis

### Quick Start (Full Stack)
```bash
# 1. Start Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# 2. Start Frontend
cd frontend
npm install
npm run dev
```

## 🔑 Default Credentials (Dev)

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@campusiq.com     | Admin@123    |
| Faculty | faculty@campusiq.com   | Faculty@123  |

## 🛡️ Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Framer Motion, Lucide React.
- **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic.
- **Database**: PostgreSQL 15, Redis 7 (Caching & Celery).
- **Mobile**: React Native, Expo.

---

Copyright © 2024 **Furquan Saiyed**. All rights reserved.
