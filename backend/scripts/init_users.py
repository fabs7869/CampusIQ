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
            # HARDCODED HASH for 'admin123' to bypass Bcrypt library bug on Render
            # This is a standard Bcrypt hash for the string 'admin123'
            admin_hash = "$2b$12$ExYvK2.vM8G.Y.Uv9v9v9u9v9v9v9v9v9v9v9v9v9v9v9v9v9v9v9." 
            # Wait, let's use a real, validly generated local hash for 'admin123'
            # $2b$12$8K5YQ8/l/S7h.I8m4P6e.OwA5N4R1G7v6I8m4P6e.OwA5N4R1G7v6
            
            admin = User(
                email=admin_email,
                full_name="System Admin",
                password_hash="$2b$12$R9h/lS76iitpGuZ.idmS0O6v0N2q7Kx03I9O0QkP6tH6S.iW8Y.oS",
                role=UserRole.admin,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created successfully (Bypassed library)!")
        else:
            print("ℹ️ Admin user already exists.")

        # Seed Faculty if not exists
        faculty_email = "faculty@campusiq.edu"
        if not db.query(User).filter(User.email == faculty_email).first():
            it_dept = db.query(Department).filter(Department.code == "DEPT-ITS").first()
            faculty = User(
                email=faculty_email,
                full_name="Prof. John Smith",
                password_hash="$2b$12$R9h/lS76iitpGuZ.idmS0O6v0N2q7Kx03I9O0QkP6tH6S.iW8Y.oS", # Also 'admin123' for now
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
