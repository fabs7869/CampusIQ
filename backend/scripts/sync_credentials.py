from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.auth.jwt import hash_password
import os

# Database URL from environment or fallback
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/campusiq"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_passwords():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.plain_password == None).all()
        print(f"Updating {len(users)} users...")
        for user in users:
            new_password = "CampusIQ@2026"
            user.password_hash = hash_password(new_password)
            user.plain_password = new_password
        db.commit()
        print("Success: All existing users reset to 'CampusIQ@2026'")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_passwords()
