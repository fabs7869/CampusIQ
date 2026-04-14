from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.complaint import ComplaintStatus, ComplaintCategory


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: ComplaintCategory
    location: str
    location_x: Optional[float] = None
    location_y: Optional[float] = None


class ComplaintVerify(BaseModel):
    remarks: Optional[str] = None


class ComplaintAssign(BaseModel):
    department_id: UUID


class ComplaintResolve(BaseModel):
    resolution_message: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: ComplaintCategory
    location: str
    location_x: Optional[float] = None
    location_y: Optional[float] = None
    status: ComplaintStatus
    before_image_url: str
    after_image_url: Optional[str] = None
    resolution_message: Optional[str] = None
    faculty_remarks: Optional[str] = None
    upvote_count: int = 0
    student_id: UUID
    student_name: str = "Student"
    assigned_department_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeedItem(BaseModel):
    id: UUID
    title: str
    description: str
    location: str
    category: ComplaintCategory
    department_name: Optional[str] = None
    before_image_url: str
    after_image_url: str
    resolution_message: Optional[str] = None
    resolved_at: datetime
    student_name: str

    model_config = {"from_attributes": True}
