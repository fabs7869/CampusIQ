from fastapi import APIRouter, BackgroundTasks, Depends
from app.schemas.support import BugReportCreate
from app.workers.tasks import send_bug_report_email
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.database import get_db
from sqlalchemy.orm import Session
from loguru import logger

router = APIRouter(prefix="/support", tags=["Support"])

@router.post("/report-bug")
def report_bug(
    body: BugReportCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a bug report. This triggers an email notification."""
    
    # Use FastAPI's native BackgroundTasks instead of Celery to avoid Redis dependency.
    background_tasks.add_task(
        send_bug_report_email,
        description=body.description,
        device_info=body.device_info,
        app_version=body.app_version,
        user_email=current_user.email
    )
    
    # Create an in-app notification for the user
    new_notification = Notification(
        user_id=current_user.id,
        type=NotificationType.bug_reported,
        title="Bug Report Submitted",
        message=f"Thank you for reporting the issue: \"{body.description[:50]}...\" Our team will investigate it.",
    )
    db.add(new_notification)
    db.commit()
    
    return {"status": "success", "message": "Bug report submitted and developer will be notified."}
