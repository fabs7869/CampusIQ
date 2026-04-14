from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.complaint import Complaint, ComplaintStatus
from app.models.department import Department
from app.models.user import User
from app.schemas.complaint import FeedItem
from app.auth.jwt import get_any_authenticated

router = APIRouter(prefix="/feed", tags=["Resolution Feed"])


@router.get("/resolved", response_model=List[dict])
def get_resolution_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    """Public resolution feed — shows resolved complaints with before/after images."""
    complaints = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.student),
            joinedload(Complaint.assigned_department),
        )
        .filter(
            Complaint.status == ComplaintStatus.resolved,
            Complaint.after_image_url.isnot(None),
        )
        .order_by(Complaint.resolved_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    from app.models.complaint import ComplaintUpvote

    feed = []
    for c in complaints:
        has_upvoted = db.query(ComplaintUpvote).filter(
            ComplaintUpvote.complaint_id == c.id,
            ComplaintUpvote.user_id == current_user.id
        ).first() is not None

        feed.append({
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "location": c.location,
            "category": c.category.value,
            "department_name": c.assigned_department.name if c.assigned_department else "General",
            "before_image_url": c.before_image_url,
            "after_image_url": c.after_image_url,
            "resolution_message": c.resolution_message,
            "resolved_at": c.resolved_at.isoformat() if c.resolved_at else None,
            "student_name": c.student.full_name if c.student else "Anonymous",
            "upvote_count": c.upvote_count,
            "has_upvoted": has_upvoted,
        })
    return feed
