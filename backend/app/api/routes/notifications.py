from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.auth.jwt import get_any_authenticated

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[dict])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .offset(skip).limit(limit)
        .all()
    )
    return [
        {
            "id": str(n.id),
            "type": n.type.value,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "complaint_id": str(n.complaint_id) if n.complaint_id else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.delete("/clear-all")
def clear_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "All notifications cleared"}


@router.post("/clear-selected")
def clear_selected(
    ids: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.id.in_(ids)
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{len(ids)} notifications cleared"}
