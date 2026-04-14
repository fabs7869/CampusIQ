import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.websockets.manager import manager
from app.auth.jwt import decode_token
from app.models.complaint import Complaint

# Import models to register with SQLAlchemy
from app.models import user, complaint, department, notification

# Import routers
from app.api.routes import auth, users, complaints, feed, analytics, notifications, departments, support

# ─── Create DB tables ─────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CampusIQ API",
    description="Smart Campus Issue & Improvement Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local network testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static files for uploads ─────────────────────────────────────────────────
os.makedirs("uploads/complaints", exist_ok=True)
os.makedirs("uploads/resolutions", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── API Routers ──────────────────────────────────────────────────────────────
PREFIX = settings.API_PREFIX

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(complaints.router, prefix=PREFIX)
app.include_router(feed.router, prefix=PREFIX)
app.include_router(analytics.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(departments.router, prefix=PREFIX)
app.include_router(support.router, prefix=PREFIX)


# ─── WebSocket endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo ping/pong for keep-alive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


@app.websocket("/ws")
async def websocket_public(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "CampusIQ API", "version": "1.0.0"}


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to CampusIQ API",
        "docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
