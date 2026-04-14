import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
from app.auth.jwt import hash_password

def init_users():
    db = SessionLocal()
    try:
        print("Checking for existing departments...")
        if db.query(Department).count() == 0:
            print("Seeding departments...")
            departments = [
                Department(name="Infrastructure & Construction", code="DEPT-INF", description="Handles building and road maintenance."),
                Department(name="Electrical & Power", code="DEPT-ELE", description="Handles electricity, lighting, and power supply."),
                Department(name="Plumbing & Water", code="DEPT-PLU", description="Handles water supply, leakage, and drainage."),
                Department(name="IT Services", code="DEPT-ITS", description="Handles internet, software, and hardware issues."),
                Department(name="Sanitation & Cleanliness", code="DEPT-SAN", description="Handles waste management and campus cleaning."),
            ]
            db.add_all(departments)
            db.commit()

        print("Checking for admin user...")
        admin_email = "admin@campusiq.edu"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if not existing_admin:
            print(f"Creating admin user: {admin_email}")
            admin = User(
                email=admin_email,
                full_name="System Admin",
                password_hash=hash_password("admin123"),
                role=UserRole.admin,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created successfully!")
        else:
            print("ℹ️ Admin user already exists.")

        # Seed Faculty if not exists
        faculty_email = "faculty@campusiq.edu"
        if not db.query(User).filter(User.email == faculty_email).first():
            it_dept = db.query(Department).filter(Department.code == "DEPT-ITS").first()
            faculty = User(
                email=faculty_email,
                full_name="Prof. John Smith",
                password_hash=hash_password("faculty123"),
                role=UserRole.faculty,
                department_id=it_dept.id,
                is_active=True,
                is_verified=True
            )
            db.add(faculty)
            db.commit()
            print("✅ Faculty user created successfully!")

    except Exception as e:
        print(f"❌ Error initializing users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_users()
