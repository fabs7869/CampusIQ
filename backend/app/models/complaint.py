import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum as SAEnum,
    Text, Integer, ForeignKey, Float, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class ComplaintStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    in_progress = "in_progress"
    pending_verification = "pending_verification"
    resolved = "resolved"
    closed = "closed"


class ComplaintCategory(str, enum.Enum):
    infrastructure = "infrastructure"
    electrical = "electrical"
    plumbing = "plumbing"
    cleanliness = "cleanliness"
    security = "security"
    it_services = "it_services"
    academic = "academic"
    transportation = "transportation"
    canteen = "canteen"
    other = "other"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SAEnum(ComplaintCategory), nullable=False)
    location = Column(String(255), nullable=False)
    location_x = Column(Float, nullable=True)  # For heatmap
    location_y = Column(Float, nullable=True)  # For heatmap
    status = Column(SAEnum(ComplaintStatus), nullable=False, default=ComplaintStatus.submitted)

    # Before image (required)
    before_image_url = Column(String(500), nullable=False)

    # After image (resolution proof)
    after_image_url = Column(String(500), nullable=True)
    resolution_message = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Faculty remarks
    faculty_remarks = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    # Upvotes
    upvote_count = Column(Integer, default=0)

    # Foreign Keys
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="complaints", foreign_keys=[student_id])
    assigned_department = relationship("Department", back_populates="assigned_complaints")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    upvotes = relationship("ComplaintUpvote", back_populates="complaint")
    notifications = relationship("Notification", back_populates="complaint")


class ComplaintUpvote(Base):
    __tablename__ = "complaint_upvotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="upvotes")
    user = relationship("User")
