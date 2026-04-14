"""
NotificationService — helper to fetch and mark notifications.
"""
from typing import List
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


class NotificationService:

    @staticmethod
    def get_for_user(db: Session, user: User, limit: int = 50) -> List[Notification]:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def unread_count(db: Session, user: User) -> int:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user.id, Notification.is_read == False)
            .count()
        )

    @staticmethod
    def mark_read(db: Session, notification_id: str, user: User) -> Notification | None:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        ).first()
        if notif:
            notif.is_read = True
            db.commit()
            db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_read(db: Session, user: User) -> int:
        updated = (
            db.query(Notification)
            .filter(Notification.user_id == user.id, Notification.is_read == False)
            .update({"is_read": True})
        )
        db.commit()
        return updated
