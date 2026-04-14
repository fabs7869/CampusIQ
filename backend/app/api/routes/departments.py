from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.department import Department
from app.models.user import User, UserRole
from app.auth.jwt import require_role, get_any_authenticated
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/departments", tags=["Departments"])


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    head_name: Optional[str] = None
    contact_email: Optional[str] = None


@router.get("", response_model=List[dict])
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [{"id": str(d.id), "name": d.name, "code": d.code, "head_name": d.head_name} for d in depts]


@router.post("", status_code=201)
def create_department(
    body: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    dept = Department(**body.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": str(dept.id), "name": dept.name}


@router.delete("/{dept_id}")
def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}
