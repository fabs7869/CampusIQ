import asyncio
from typing import Dict, Set
from fastapi import WebSocket
from loguru import logger


class ConnectionManager:
    def __init__(self):
        # Maps user_id -> list of WebSocket connections
        self.active_connections: Dict[str, list[WebSocket]] = {}
        # Global connections (all connected clients)
        self._all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self._all_connections.add(websocket)
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected: {user_id or 'anonymous'} | Total: {len(self._all_connections)}")

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        self._all_connections.discard(websocket)
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected: {user_id or 'anonymous'}")

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific user."""
        connections = self.active_connections.get(user_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, message: dict):
        """Broadcast to all connected clients."""
        dead = []
        for ws in list(self._all_connections):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._all_connections.discard(ws)


manager = ConnectionManager()
