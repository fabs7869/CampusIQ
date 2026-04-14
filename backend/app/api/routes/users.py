from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.user import (
    UserResponse, UserUpdate, BadgeStatusResponse, 
    UserActivityUpdate, UserCreate, AdminPasswordChangeRequest
)
from app.auth.jwt import get_current_user, require_role, hash_password
from datetime import datetime
import uuid

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("", response_model=List[UserResponse])
def list_users(
    role: UserRole = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=UserResponse)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    new_user = User(
        id=uuid.uuid4(),
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        plain_password=body.password,
        role=body.role,
        department_id=body.department_id,
        student_id=body.student_id,
        phone=body.phone,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/{user_id}/reset-password", response_model=UserResponse)
def reset_password(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Set a standard recovery password as agreed
    new_password = "CampusIQ@2026"
    user.password_hash = hash_password(new_password)
    user.plain_password = new_password
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/change-password", response_model=UserResponse)
def admin_change_password(
    user_id: uuid.UUID,
    body: AdminPasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = hash_password(body.new_password)
    user.plain_password = body.new_password
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"message": f"User {user.email} deactivated"}


@router.patch("/{user_id}/activate")
def activate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"message": f"User {user.email} activated"}


@router.get("/me/badge-status", response_model=BadgeStatusResponse)
def get_badge_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the count of unread items for badges."""
    # 1. Unread notifications
    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    # 2. New feed items (resolved complaints since last view)
    new_feed_items = db.query(Complaint).filter(
        Complaint.status == ComplaintStatus.resolved,
        Complaint.after_image_url.isnot(None),
        Complaint.resolved_at > current_user.last_feed_viewed_at
    ).count()

    # 3. New complaint updates (my complaints updated since last view)
    # We only count complaints that the user HAS but were updated recently.
    new_complaint_updates = db.query(Complaint).filter(
        Complaint.student_id == current_user.id,
        Complaint.updated_at > current_user.last_complaints_viewed_at
    ).count()

    return BadgeStatusResponse(
        unread_notifications=unread_notifications,
        new_feed_items=new_feed_items,
        new_complaint_updates=new_complaint_updates
    )


@router.put("/me/activity")
def update_activity(
    body: UserActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the 'last viewed' timestamps for sections."""
    if body.last_feed_viewed_at:
        current_user.last_feed_viewed_at = body.last_feed_viewed_at
    if body.last_complaints_viewed_at:
        current_user.last_complaints_viewed_at = body.last_complaints_viewed_at
    
    db.commit()
    return {"message": "Activity updated"}
