"""
ComplaintService — business logic for complaint lifecycle.
Keeps route handlers thin; actual DB mutations live here.
"""
import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory, ComplaintUpvote
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from app.models.department import Department
from app.config import settings


def _save_upload(file: UploadFile, subfolder: str, complaint_id: str) -> str:
    """Persist an uploaded image and return its public URL path."""
    dest = f"{settings.UPLOAD_DIR}/{subfolder}/{complaint_id}"
    os.makedirs(dest, exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    rel_path = f"{subfolder}/{complaint_id}/image.{ext}"
    with open(f"{settings.UPLOAD_DIR}/{rel_path}", "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return f"/uploads/{rel_path}"


def _create_notification(
    db: Session,
    user_id,
    complaint_id: str,
    notif_type: NotificationType,
    title: str,
    message: str,
) -> None:
    db.add(Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        type=notif_type,
        title=title,
        message=message,
    ))


class ComplaintService:
    # ── Submit ────────────────────────────────────────────────────────────────
    @staticmethod
    def create(
        db: Session,
        student: User,
        title: str,
        description: str,
        category: ComplaintCategory,
        location: str,
        image: UploadFile,
        location_x: Optional[float] = None,
        location_y: Optional[float] = None,
    ) -> Complaint:
        complaint_id = str(uuid.uuid4())
        image_url = _save_upload(image, "complaints", complaint_id)

        complaint = Complaint(
            id=complaint_id,
            title=title,
            description=description,
            category=category,
            location=location,
            location_x=location_x,
            location_y=location_y,
            before_image_url=image_url,
            student_id=student.id,
        )
        db.add(complaint)

        # Notify student
        _create_notification(
            db, student.id, complaint_id,
            NotificationType.complaint_submitted,
            "Complaint Submitted",
            f"Your complaint '{title}' has been submitted and is pending review.",
        )

        # Notify all admins
        for admin in db.query(User).filter(User.role == UserRole.admin).all():
            _create_notification(
                db, admin.id, complaint_id,
                NotificationType.complaint_submitted,
                "New Complaint",
                f"{student.full_name} submitted: '{title}'",
            )

        db.commit()
        db.refresh(complaint)
        return complaint

    # ── Verify ────────────────────────────────────────────────────────────────
    @staticmethod
    def verify(
        db: Session,
        complaint: Complaint,
        verifier: User,
        remarks: Optional[str] = None,
    ) -> Complaint:
        complaint.status = ComplaintStatus.under_review
        complaint.faculty_remarks = remarks
        complaint.verified_by_id = verifier.id
        complaint.verified_at = datetime.utcnow()

        _create_notification(
            db, complaint.student_id, str(complaint.id),
            NotificationType.complaint_verified,
            "Complaint Verified ✅",
            f"Your complaint '{complaint.title}' has been verified.",
        )

        db.commit()
        db.refresh(complaint)
        return complaint

    # ── Assign Department ──────────────────────────────────────────────────────
    @staticmethod
    def assign(
        db: Session,
        complaint: Complaint,
        assigner: User,
        department: Department,
    ) -> Complaint:
        complaint.assigned_department_id = department.id
        complaint.assigned_by_id = assigner.id
        complaint.status = ComplaintStatus.in_progress

        _create_notification(
            db, complaint.student_id, str(complaint.id),
            NotificationType.complaint_assigned,
            "Complaint Assigned",
            f"Your complaint has been assigned to {department.name}.",
        )

        for faculty in db.query(User).filter(
            User.department_id == department.id,
            User.role == UserRole.faculty,
        ).all():
            _create_notification(
                db, faculty.id, str(complaint.id),
                NotificationType.new_department_complaint,
                "New Complaint Assigned",
                f"'{complaint.title}' has been assigned to your department.",
            )

        db.commit()
        db.refresh(complaint)
        return complaint

    # ── Resolve ────────────────────────────────────────────────────────────────
    @staticmethod
    def resolve(
        db: Session,
        complaint: Complaint,
        resolver: User,
        after_image: UploadFile,
        resolution_message: Optional[str] = None,
    ) -> Complaint:
        complaint.after_image_url = _save_upload(after_image, "resolutions", str(complaint.id))
        complaint.resolution_message = resolution_message
        complaint.status = ComplaintStatus.resolved
        complaint.resolved_by_id = resolver.id
        complaint.resolved_at = datetime.utcnow()

        _create_notification(
            db, complaint.student_id, str(complaint.id),
            NotificationType.complaint_resolved,
            "🎉 Complaint Resolved!",
            f"Your complaint '{complaint.title}' has been resolved. Check the proof!",
        )

        db.commit()
        db.refresh(complaint)
        return complaint

    # ── Upvote (toggle) ────────────────────────────────────────────────────────
    @staticmethod
    def toggle_upvote(db: Session, complaint_id: str, user: User) -> dict:
        existing = db.query(ComplaintUpvote).filter(
            ComplaintUpvote.complaint_id == complaint_id,
            ComplaintUpvote.user_id == user.id,
        ).first()

        if existing:
            db.delete(existing)
            db.query(Complaint).filter(Complaint.id == complaint_id).update(
                {"upvote_count": Complaint.upvote_count - 1}
            )
            db.commit()
            return {"upvoted": False, "message": "Upvote removed"}

        db.add(ComplaintUpvote(complaint_id=complaint_id, user_id=user.id))
        db.query(Complaint).filter(Complaint.id == complaint_id).update(
            {"upvote_count": Complaint.upvote_count + 1}
        )
        db.commit()
        return {"upvoted": True, "message": "Upvoted"}
