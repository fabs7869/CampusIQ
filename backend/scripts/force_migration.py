from sqlalchemy import create_engine, text
from app.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists, if not add it
            query = text("ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255)")
            conn.execute(query)
            conn.commit()
            print("Successfully added plain_password column.")
            
            # Reset all current users to a standard password for transparency
            reset_query = text("UPDATE users SET plain_password = 'CampusIQ@2026' WHERE plain_password IS NULL")
            conn.execute(reset_query)
            conn.commit()
            print("Successfully synchronized 2026 recovery credentials.")
            
        except Exception as e:
            print(f"Migration Error: {e}")

if __name__ == "__main__":
    migrate()
