import sys
import os
from sqlalchemy import text

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.auth.jwt import hash_password

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding initial data...")
        
        # 1. Seed Departments
        departments = [
            Department(name="Infrastructure & Construction", code="DEPT-INF", description="Handles building and road maintenance."),
            Department(name="Electrical & Power", code="DEPT-ELE", description="Handles electricity, lighting, and power supply."),
            Department(name="Plumbing & Water", code="DEPT-PLU", description="Handles water supply, leakage, and drainage."),
            Department(name="IT Services", code="DEPT-ITS", description="Handles internet, software, and hardware issues."),
            Department(name="Sanitation & Cleanliness", code="DEPT-SAN", description="Handles waste management and campus cleaning."),
        ]
        db.add_all(departments)
        db.commit()
        
        # 2. Seed Users
        # Admin
        admin = User(
            email="admin@campusiq.edu",
            full_name="System Admin",
            password_hash=hash_password("admin123"),
            role=UserRole.admin,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        
        # Faculty Member (for IT Department)
        it_dept = db.query(Department).filter(Department.code == "DEPT-ITS").first()
        faculty = User(
            email="faculty@campusiq.edu",
            full_name="Prof. John Smith",
            password_hash=hash_password("faculty123"),
            role=UserRole.faculty,
            department_id=it_dept.id,
            is_active=True,
            is_verified=True
        )
        db.add(faculty)
        
        # Student
        student = User(
            email="student@campusiq.edu",
            full_name="Alice Johnson",
            password_hash=hash_password("student123"),
            role=UserRole.student,
            student_id="STU001",
            is_active=True,
            is_verified=True
        )
        db.add(student)
        
        db.commit()
        print("Database reset and seeding completed successfully!")
        
    except Exception as e:
        print(f"Error resetting database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
