from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user, get_current_admin
from app.models.models import User, UserRole, AuditLog
from app.schemas.schemas import (
    CitizenRegisterRequest, WorkerCreateRequest, UserLogin,
    VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UserResponse, Token
)
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])

def log_audit(db: Session, user_id: Optional[int], action: str, details: str):
    audit = AuditLog(
        user_id=user_id,
        action=action,
        resource_type="User",
        resource_id=str(user_id) if user_id else "auth",
        details=details
    )
    db.add(audit)
    db.commit()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_citizen(user_in: CitizenRegisterRequest, db: Session = Depends(get_db)):
    """
    Public registration endpoint. Enforces that only Citizens can self-register.
    Generates a secure verification token and dispatches an activation email.
    """
    email_clean = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account is already registered with this email address."
        )

    # Generate verification token
    verification_token = email_service.generate_token()
    token_expires = email_service.get_token_expiry(hours=24)

    # Determine initial verification state based on platform policy
    is_verified_initial = False if settings.REQUIRE_EMAIL_VERIFICATION else True

    user = User(
        email=email_clean,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        role=UserRole.CITIZEN,  # STRICT: Public registration can NEVER grant Admin or Worker
        department_id=None,
        is_active=True,
        is_verified=is_verified_initial,
        verification_token=verification_token,
        verification_token_expires_at=token_expires
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Dispatch email
    sent, email_msg = email_service.send_verification_email(
        to_email=user.email,
        full_name=user.full_name,
        token=verification_token
    )

    log_audit(
        db=db,
        user_id=user.id,
        action="CITIZEN_REGISTER",
        details=f"Citizen registered: {user.email}. Verification email dispatch status: {email_msg}"
    )

    # If verification is required, inform citizen to verify email
    if settings.REQUIRE_EMAIL_VERIFICATION:
        return {
            "message": "Account created successfully. A verification link has been sent to your email address.",
            "email": user.email,
            "requires_verification": True,
            "verification_dispatched": sent
        }

    # Otherwise issue immediate token
    token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verifies user's email address using the secure token and activates their session.
    """
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    if user.is_verified:
        # Already verified; generate token so user can proceed
        token = create_access_token(subject=user.id, role=user.role.value)
        return {
            "message": "Email is already verified.",
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user)
        }

    if not user.verification_token or user.verification_token != payload.token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token.")

    # Check expiration
    now = datetime.now(timezone.utc)
    # Ensure timezone awareness for comparison
    expiry = user.verification_token_expires_at
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry and expiry < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new verification link."
        )

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.commit()
    db.refresh(user)

    log_audit(db=db, user_id=user.id, action="EMAIL_VERIFIED", details=f"Email verified for {user.email}")

    token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "message": "Email successfully verified! Your account is fully activated.",
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/resend-verification")
def resend_verification(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Resends an email verification link to an unverified user.
    """
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user:
        # Prevent email enumeration
        return {"message": "If an unverified account exists with this email, a new verification link has been sent."}

    if user.is_verified:
        return {"message": "This account is already verified. You can sign in directly."}

    new_token = email_service.generate_token()
    user.verification_token = new_token
    user.verification_token_expires_at = email_service.get_token_expiry(hours=24)
    db.commit()

    email_service.send_verification_email(user.email, user.full_name, new_token)
    return {"message": "A fresh verification link has been sent to your email address."}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a secure password reset token and dispatches an email with reset instructions.
    """
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if user and user.is_active:
        token = email_service.generate_token()
        user.reset_password_token = token
        user.reset_password_token_expires_at = email_service.get_token_expiry(hours=1)
        db.commit()

        email_service.send_password_reset_email(
            to_email=user.email,
            full_name=user.full_name,
            token=token
        )

        log_audit(db=db, user_id=user.id, action="PASSWORD_RESET_REQUESTED", details=f"Reset token issued for {user.email}")

    # Standard safe response against enumeration
    return {"message": "If an account exists with this email address, password reset instructions have been sent."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validates the password reset token and updates the user's password.
    """
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not user.reset_password_token or user.reset_password_token != payload.token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    now = datetime.now(timezone.utc)
    expiry = user.reset_password_token_expires_at
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry and expiry < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired. Please request a new one.")

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token = None
    user.reset_password_token_expires_at = None
    user.is_verified = True  # Verifying via secure email token proves ownership
    db.commit()

    log_audit(db=db, user_id=user.id, action="PASSWORD_RESET_COMPLETED", details=f"Password updated for {user.email}")
    return {"message": "Password has been successfully updated. You may now sign in with your new credentials."}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates Citizen, Field Worker, or Administrator with secure password hashing.
    Enforces verification policy and account active status.
    """
    user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")

    # Email verification check
    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. Please verify your email before logging in or request a new verification link."
        )

    # Session duration based on remember-me
    if login_data.remember_me:
        delta = timedelta(days=30)
    else:
        delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    token = create_access_token(subject=user.id, role=user.role.value, expires_delta=delta)

    log_audit(db=db, user_id=user.id, action="USER_LOGIN", details=f"User {user.email} logged in ({user.role.value})")

    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[UserRole] = None,
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if department_id:
        query = query.filter(User.department_id == department_id)
    return [UserResponse.model_validate(u) for u in query.all()]
