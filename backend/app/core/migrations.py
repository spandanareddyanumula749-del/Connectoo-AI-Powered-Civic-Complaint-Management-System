import logging
from sqlalchemy import inspect, text
from app.core.database import engine, Base
import app.models.models  # ensure models are imported

logger = logging.getLogger(__name__)

def run_auto_migrations():
    """
    Safely inspects tables and adds any missing columns without dropping data.
    """
    Base.metadata.create_all(bind=engine)
    
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("users")]
        with engine.connect() as conn:
            if "is_verified" not in columns:
                logger.info("Adding column is_verified to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0 NOT NULL"))
                conn.execute(text("UPDATE users SET is_verified = 1"))  # Seeded/existing users are verified
            if "verification_token" not in columns:
                logger.info("Adding column verification_token to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)"))
            if "verification_token_expires_at" not in columns:
                logger.info("Adding column verification_token_expires_at to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_token_expires_at DATETIME"))
            if "reset_password_token" not in columns:
                logger.info("Adding column reset_password_token to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255)"))
            if "reset_password_token_expires_at" not in columns:
                logger.info("Adding column reset_password_token_expires_at to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_password_token_expires_at DATETIME"))
            conn.commit()
