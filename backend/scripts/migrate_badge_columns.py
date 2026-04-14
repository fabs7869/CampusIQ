from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_feed_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            print("Added column last_feed_viewed_at")
        except Exception as e:
            print(f"Column last_feed_viewed_at might already exist or error: {e}")
        
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_complaints_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            print("Added column last_complaints_viewed_at")
        except Exception as e:
            print(f"Column last_complaints_viewed_at might already exist or error: {e}")
        
        conn.commit()

if __name__ == "__main__":
    migrate()
    print("Migration complete")
