import sys
import os
from datetime import datetime, timedelta

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory

def seed_complaints():
    db = SessionLocal()
    try:
        print("Seeding dummy complaints...")
        
        student = db.query(User).filter(User.role == UserRole.student).first()
        admin = db.query(User).filter(User.role == UserRole.admin).first()
        
        it_dept = db.query(Department).filter(Department.code == "DEPT-ITS").first()
        infra_dept = db.query(Department).filter(Department.code == "DEPT-INF").first()
        plumbing_dept = db.query(Department).filter(Department.code == "DEPT-PLU").first()

        if not student:
            print("No student found. Run reset_db.py first.")
            return

        complaints = [
            Complaint(
                title="Wi-Fi not working in Library 2nd Floor",
                description="The router seems to be off since yesterday evening. No one can connect.",
                category=ComplaintCategory.it_services,
                location="Library 2nd Floor",
                status=ComplaintStatus.submitted,
                before_image_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600&auto=format&fit=crop",
                student_id=student.id,
                assigned_department_id=it_dept.id,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            Complaint(
                title="Broken pipe in Engineering Block Restroom",
                description="Water is leaking continuously from the washbasin pipe.",
                category=ComplaintCategory.plumbing,
                location="Engineering Block Ground Floor",
                status=ComplaintStatus.in_progress,
                before_image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop",
                student_id=student.id,
                assigned_department_id=plumbing_dept.id,
                created_at=datetime.utcnow() - timedelta(days=5),
                upvote_count=12
            ),
            Complaint(
                title="Pothole near Main Entrance",
                description="A large pothole has formed near the gate, creating issues for vehicles.",
                category=ComplaintCategory.infrastructure,
                location="Main Entrance Gate",
                status=ComplaintStatus.resolved,
                before_image_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop",
                after_image_url="https://images.unsplash.com/photo-1584883441999-6f17e07663d8?q=80&w=600&auto=format&fit=crop",
                resolution_message="The pothole was filled with concrete and tested.",
                student_id=student.id,
                assigned_department_id=infra_dept.id,
                resolved_by_id=admin.id,
                resolved_at=datetime.utcnow() - timedelta(hours=2),
                created_at=datetime.utcnow() - timedelta(days=10),
                upvote_count=45
            )
        ]
        
        db.add_all(complaints)
        db.commit()
        print(f"Successfully seeded {len(complaints)} complaints!")
        
    except Exception as e:
        print(f"Error seeding complaints: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_complaints()
