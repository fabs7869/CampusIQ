from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.complaint import Complaint
from app.services.nlp_learning import update_brain

def bootstrap_ai():
    """
    Data Science Backfilling: Trains the AI on all historical complaints.
    This ensures it learns from the 'PC' issues and other past reports.
    """
    db = SessionLocal()
    try:
        print("🔍 Starting AI Brain Bootstrap (Historical Learning)...")
        complaints = db.query(Complaint).all()
        count = 0
        for comp in complaints:
            update_brain(db, comp.description, comp.category)
            count += 1
        print(f"✅ Successfully trained the AI on {count} historical campus reports!")
    except Exception as e:
        print(f"❌ Bootstrap error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap_ai()
