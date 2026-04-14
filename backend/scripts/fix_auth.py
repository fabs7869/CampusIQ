from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.auth.jwt import hash_password, verify_password
from app.config import settings

def fix_auth():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Syncing {len(users)} users...")
        target_pwd = "CampusIQ@2026"
        
        for user in users:
            new_hash = hash_password(target_pwd)
            user.password_hash = new_hash
            user.plain_password = target_pwd
            user.is_active = True # Ensure they are all enabled for this test
            
            # Immediate verification test
            if verify_password(target_pwd, user.password_hash):
                print(f"Verified: {user.email}")
            else:
                print(f"FAILED Verification: {user.email}")
                
        db.commit()
        print("Final Sync Complete. All users set to 'CampusIQ@2026'")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_auth()
