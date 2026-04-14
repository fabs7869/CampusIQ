import sys
import os
sys.path.append('.')

from app.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.auth.jwt import hash_password
from sqlalchemy.orm import Session

def restore():
    db = SessionLocal()
    try:
        users_to_restore = [
            {
                "email": "admin@campusiq.edu",
                "full_name": "System Admin",
                "password": "admin123",
                "role": UserRole.admin
            },
            {
                "email": "224furquanahmed8003@sjcem.edu.in",
                "full_name": "Furquan Saiyed",
                "password": "Fur,12345",
                "role": UserRole.student
            },
            {
                "email": "devanshu@campusiq.edu",
                "full_name": "Devanshu Pal",
                "password": "devanshu123",
                "role": UserRole.faculty
            },
            {
                "email": "faculty@campusiq.edu",
                "full_name": "Prof. John Smith",
                "password": "johnsmith123",
                "role": UserRole.faculty
            },
            {
                "email": "ramesh@campusiq.com",
                "full_name": "Ramesh Singh",
                "password": "Ramesh@123",
                "role": UserRole.admin
            }
        ]

        for u_data in users_to_restore:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                print(f"Creating user: {u_data['email']}")
                user = User(
                    email=u_data["email"],
                    full_name=u_data["full_name"],
                    password_hash=hash_password(u_data["password"]),
                    role=u_data["role"],
                    is_active=True
                )
                db.add(user)
            else:
                print(f"Updating user: {u_data['email']}")
                user.full_name = u_data["full_name"]
                user.role = u_data["role"]
                user.is_active = True
                user.password_hash = hash_password(u_data["password"])
            
            db.commit()
            print(f"SUCCESS: {u_data['email']} restored.")

    finally:
        db.close()

if __name__ == "__main__":
    restore()
