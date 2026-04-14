import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory, ComplaintUpvote
from app.models.department import Department
from app.models.notification import Notification, NotificationType
from app.schemas.complaint import ComplaintResponse, ComplaintVerify, ComplaintAssign, ComplaintResolve
from app.auth.jwt import get_current_user, require_role, get_any_authenticated
from app.websockets.manager import manager
from app.config import settings
from app.services.nlp_learning import update_brain
from loguru import logger

router = APIRouter(prefix="/complaints", tags=["Complaints"])


def save_upload(file: UploadFile, subfolder: str, complaint_id: str) -> str:
    """Save an uploaded file and return its URL path."""
    os.makedirs(f"{settings.UPLOAD_DIR}/{subfolder}/{complaint_id}", exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{subfolder}/{complaint_id}/image.{ext}"
    full_path = f"{settings.UPLOAD_DIR}/{filename}"
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/uploads/{filename}"


def create_notification(db: Session, user_id, complaint_id, notif_type: NotificationType, title: str, message: str):
    notif = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        type=notif_type,
        title=title,
        message=message,
    )
    db.add(notif)


# ─── Submit Complaint ─────────────────────────────────────────────────────────
@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category: ComplaintCategory = Form(...),
    location: str = Form(...),
    location_x: Optional[float] = Form(None),
    location_y: Optional[float] = Form(None),
    image: UploadFile = File(..., description="Before image proof (required)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.student)),
):
    # Validate image
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    complaint_id = str(uuid.uuid4())
    image_url = save_upload(image, "complaints", complaint_id)

    complaint = Complaint(
        id=complaint_id,
        title=title,
        description=description,
        category=category,
        location=location,
        location_x=location_x,
        location_y=location_y,
        before_image_url=image_url,
        student_id=current_user.id,
    )
    db.add(complaint)

    # Self-notification for student
    create_notification(
        db, current_user.id, complaint_id,
        NotificationType.complaint_submitted,
        "Complaint Submitted",
        f"Your complaint '{title}' has been submitted successfully and is under review.",
    )

    # Notify all admins
    admins = db.query(User).filter(User.role == UserRole.admin).all()
    for admin in admins:
        create_notification(
            db, admin.id, complaint_id,
            NotificationType.complaint_submitted,
            "New Complaint Submitted",
            f"Student {current_user.full_name} submitted: '{title}'",
        )

    # 🧠 Trigger Data Science Learning (Dynamic NLP)
    # The AI now learns from this description to improve future suggestions
    update_brain(db, complaint.description, complaint.category)

    db.commit()
    db.refresh(complaint)

    # WebSocket broadcast
    await manager.broadcast({"event": "new_complaint", "complaint_id": complaint_id, "title": title})

    logger.info(f"Complaint submitted: {complaint_id} by {current_user.email}")
    return complaint


# ─── List Complaints ──────────────────────────────────────────────────────────
@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    status_filter: Optional[ComplaintStatus] = None,
    category: Optional[ComplaintCategory] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    query = db.query(Complaint)

    if current_user.role == UserRole.student:
        query = query.filter(Complaint.student_id == current_user.id)
    elif current_user.role == UserRole.faculty:
        query = query.filter(Complaint.assigned_department_id == current_user.department_id)

    query = query.join(User, Complaint.student_id == User.id)

    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if category:
        query = query.filter(Complaint.category == category)

    results = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    
    # Manually attach student_name for the schema
    for r in results:
        r.student_name = r.student.full_name
        
    return results


# ─── Get Single Complaint ─────────────────────────────────────────────────────
@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.student_name = complaint.student.full_name
    return complaint


# ─── Verify Complaint (Faculty) ───────────────────────────────────────────────
@router.patch("/{complaint_id}/verify", response_model=ComplaintResponse)
async def verify_complaint(
    complaint_id: str,
    body: ComplaintVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.faculty, UserRole.admin)),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.status != ComplaintStatus.submitted:
        raise HTTPException(status_code=400, detail="Complaint already processed")

    complaint.status = ComplaintStatus.under_review
    complaint.faculty_remarks = body.remarks
    complaint.verified_by_id = current_user.id
    complaint.verified_at = datetime.utcnow()

    create_notification(
        db, complaint.student_id, complaint_id,
        NotificationType.complaint_verified,
        "Complaint Verified",
        f"Your complaint '{complaint.title}' has been verified and is under review.",
    )

    db.commit()
    db.refresh(complaint)
    await manager.broadcast({"event": "complaint_verified", "complaint_id": complaint_id})
    logger.info(f"Complaint {complaint_id} verified by {current_user.email}")
    return complaint


# ─── Assign Department (Admin) ────────────────────────────────────────────────
@router.patch("/{complaint_id}/assign", response_model=ComplaintResponse)
async def assign_complaint(
    complaint_id: str,
    body: ComplaintAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    dept = db.query(Department).filter(Department.id == body.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    complaint.assigned_department_id = body.department_id
    complaint.assigned_by_id = current_user.id
    complaint.status = ComplaintStatus.in_progress

    create_notification(
        db, complaint.student_id, complaint_id,
        NotificationType.complaint_assigned,
        "Complaint Assigned",
        f"Your complaint '{complaint.title}' has been assigned to {dept.name} department.",
    )

    # Notify faculty in that department
    faculty_members = db.query(User).filter(
        User.department_id == body.department_id,
        User.role == UserRole.faculty
    ).all()
    for faculty in faculty_members:
        create_notification(
            db, faculty.id, complaint_id,
            NotificationType.new_department_complaint,
            "New Complaint Assigned",
            f"Complaint '{complaint.title}' has been assigned to your department.",
        )

    db.commit()
    db.refresh(complaint)
    await manager.broadcast({"event": "complaint_assigned", "complaint_id": complaint_id})
    logger.info(f"Complaint {complaint_id} assigned to dept {dept.name}")
    return complaint


# ─── Resolve Complaint ────────────────────────────────────────────────────────
@router.post("/{complaint_id}/resolve", response_model=ComplaintResponse)
async def resolve_complaint(
    complaint_id: str,
    resolution_message: Optional[str] = Form(None),
    after_image: UploadFile = File(..., description="Resolution proof image (required)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.faculty, UserRole.admin)),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if not after_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    after_image_url = save_upload(after_image, "resolutions", complaint_id)

    complaint.after_image_url = after_image_url
    complaint.resolution_message = resolution_message
    complaint.status = ComplaintStatus.resolved
    complaint.resolved_by_id = current_user.id
    complaint.resolved_at = datetime.utcnow()

    # Notify student (Directly resolved as requested)
    create_notification(
        db, complaint.student_id, complaint_id,
        NotificationType.complaint_resolved,
        "✅ Resolution Finalized",
        f"Your complaint '{complaint.title}' has been fixed and resolved by faculty.",
    )

    # Notify admins
    admins = db.query(User).filter(User.role == UserRole.admin).all()
    for admin in admins:
        create_notification(
            db, admin.id, complaint_id,
            NotificationType.complaint_resolved,
            "🛡️ Resolution Audit Required",
            f"Faculty {current_user.full_name} submitted a resolution for '{complaint.title}'. Please verify.",
        )

    db.commit()
    db.refresh(complaint)

    await manager.broadcast({
        "event": "complaint_resolved",
        "complaint_id": complaint_id,
        "title": complaint.title,
    })
    logger.info(f"Complaint {complaint_id} resolved by {current_user.email}")
    return complaint


# ─── Upvote Complaint ─────────────────────────────────────────────────────────
@router.post("/{complaint_id}/upvote")
def upvote_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.student)),
):
    existing = db.query(ComplaintUpvote).filter(
        ComplaintUpvote.complaint_id == complaint_id,
        ComplaintUpvote.user_id == current_user.id
    ).first()
    if existing:
        db.delete(existing)
        db.query(Complaint).filter(Complaint.id == complaint_id).update(
            {"upvote_count": Complaint.upvote_count - 1}
        )
        db.commit()
        return {"message": "Upvote removed", "upvoted": False}

    upvote = ComplaintUpvote(complaint_id=complaint_id, user_id=current_user.id)
    db.add(upvote)
    db.query(Complaint).filter(Complaint.id == complaint_id).update(
        {"upvote_count": Complaint.upvote_count + 1}
    )
    db.commit()
    return {"message": "Upvoted", "upvoted": True}


# ─── Admin Verify Resolution ──────────────────────────────────────────────────
@router.patch("/{complaint_id}/verify-resolution", response_model=ComplaintResponse)
async def admin_verify_resolution(
    complaint_id: str,
    approved: bool = Form(...),
    remarks: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.status != ComplaintStatus.pending_verification:
        raise HTTPException(status_code=400, detail="Complaint not in verification queue")

    if approved:
        complaint.status = ComplaintStatus.resolved
        complaint.verified_by_id = current_user.id
        complaint.verified_at = datetime.utcnow()
        if remarks:
            complaint.resolution_message = f"{complaint.resolution_message}\n\nAdmin Note: {remarks}"
        
        # Final notification to student
        create_notification(
            db, complaint.student_id, complaint_id,
            NotificationType.complaint_resolved,
            "✅ Resolution Officially Verified",
            f"The resolution for '{complaint.title}' has been audited and approved by the administration.",
        )
    else:
        # Rejected - send back to in_progress
        complaint.status = ComplaintStatus.in_progress
        # Optionally log the rejection in faculty remarks
        complaint.faculty_remarks = f"Admin Rejected Resolution: {remarks}"
        
        # Notify faculty
        if complaint.resolved_by_id:
            create_notification(
                db, complaint.resolved_by_id, complaint_id,
                NotificationType.new_department_complaint,
                "⚠️ Resolution Rejected",
                f"The resolution proof for '{complaint.title}' was rejected by Admin: {remarks}",
            )

    db.commit()
    db.refresh(complaint)
    
    await manager.broadcast({
        "event": "complaint_verified_resolution",
        "complaint_id": complaint_id,
        "approved": approved
    })
    
    return complaint
