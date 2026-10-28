"""
Secure Admin Account Provisioning Script for Connectoo
Run via: python create_admin.py [--email admin@connectoo.gov] [--name "Municipal Commissioner"] [--password password]
"""
import sys
import argparse
import os
from sqlalchemy.orm import Session

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.core.migrations import run_auto_migrations
from app.core.security import get_password_hash
from app.models.models import User, UserRole

def create_admin(email: str, full_name: str, password: str, phone: str = None):
    run_auto_migrations()
    db: Session = SessionLocal()
    try:
        email_clean = email.strip().lower()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            if existing.role == UserRole.ADMIN:
                print(f"[INFO] Admin user '{email_clean}' already exists. Updating password...")
                existing.hashed_password = get_password_hash(password)
                existing.full_name = full_name
                existing.is_active = True
                existing.is_verified = True
                db.commit()
                print(f"[SUCCESS] Admin account '{email_clean}' successfully updated.")
                return
            else:
                print(f"[ERROR] An account with email '{email_clean}' exists with role '{existing.role.value}'. Aborting.")
                return

        admin = User(
            email=email_clean,
            hashed_password=get_password_hash(password),
            full_name=full_name.strip(),
            phone=phone,
            role=UserRole.ADMIN,
            department_id=None,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        db.commit()
        print(f"[SUCCESS] Municipal Administrator '{email_clean}' provisioned successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Provision an Administrator account for Connectoo")
    parser.add_argument("--email", default=os.getenv("INITIAL_ADMIN_EMAIL", "admin@connectoo.gov"), help="Admin email address")
    parser.add_argument("--name", default=os.getenv("INITIAL_ADMIN_NAME", "Municipal Commissioner"), help="Admin full name")
    parser.add_argument("--password", default=os.getenv("INITIAL_ADMIN_PASSWORD", "admin123"), help="Admin password")
    parser.add_argument("--phone", default="+91 40 2322 0001", help="Official contact phone")

    args = parser.parse_args()
    create_admin(args.email, args.name, args.password, args.phone)
