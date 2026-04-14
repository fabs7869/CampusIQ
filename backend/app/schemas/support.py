from pydantic import BaseModel, EmailStr
from typing import Optional

class BugReportCreate(BaseModel):
    description: str
    device_info: Optional[str] = None
    app_version: Optional[str] = "v1.0.0"
    user_email: Optional[EmailStr] = None
