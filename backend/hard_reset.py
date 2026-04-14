import sys
import os
sys.path.append('.')

from app.database import SessionLocal, engine
from app.models.user import User
from app.models.complaint import Complaint, ComplaintUpvote
from app.models.notification import Notification, Suggestion
from app.models.nlp_learning import NLPLearnedKeyword
from sqlalchemy.orm import Session

def hard_reset():
    db = SessionLocal()
    try:
        # 1. Clear Activity and Metadata tables first
        print("Clearing Upvotes and Notifications...")
        db.query(ComplaintUpvote).delete()
        db.query(Notification).delete()
        db.query(Suggestion).delete()
        db.query(NLPLearnedKeyword).delete()
        db.commit()

        # 2. Clear Complaints (Foreign Keys to User and Dept)
        print("Clearing All Complaints...")
        db.query(Complaint).delete()
        db.commit()

        # 3. Clear Non-Protected Users
        protected_emails = [
            "admin@campusiq.edu",
            "ramesh@campusiq.com",
            "224furquanahmed8003@sjcem.edu.in",
            "devanshu@campusiq.edu",
            "faculty@campusiq.edu"
        ]
        
        print(f"Clearing all users EXCEPT: {protected_emails}")
        # Note: If there are foreign keys from other tables not included here, this might fail.
        # But for basic reset of complaints/notifications, this is correct for your schema.
        db.query(User).filter(User.email.notin_(protected_emails)).delete(synchronize_session='fetch')
        db.commit()

        print("\n=== HARD RESET COMPLETE ===")
        print("Database is now clean and ready for new users.")

    except Exception as e:
        print(f"ERROR DURING RESET: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    hard_reset()
