from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.config import settings
import sys

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def report_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("| Full Name | Email | Role | Current Password | Status |")
        print("|---|---|---|---|---|")
        for u in users:
            pwd = u.plain_password if u.plain_password else "LEGACY_SECURED"
            status = "Active" if u.is_active else "Disabled"
            print(f"| {u.full_name} | {u.email} | {u.role.value} | {pwd} | {status} |")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    report_users()
