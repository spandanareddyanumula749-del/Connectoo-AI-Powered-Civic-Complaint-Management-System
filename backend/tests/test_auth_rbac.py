import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.models import User, UserRole, Complaint, ComplaintStatus

client = TestClient(app)

def test_public_registration_and_verification_flow():
    """Verify that public registration always creates a citizen role, sends verification, and verification succeeds."""
    unique_email = f"citizen_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "full_name": "Test Citizen",
        "password": "Password123!",
        "phone": "+91 99999 88888"
    })
    assert res.status_code == 201
    data = res.json()
    assert "email" in data or "access_token" in data

    # Verify directly in DB
    db = SessionLocal()
    user = db.query(User).filter(User.email == unique_email).first()
    assert user is not None
    assert user.role == UserRole.CITIZEN
    assert user.verification_token is not None
    token = user.verification_token
    db.close()

    # Verify email
    v_res = client.post("/api/v1/auth/verify-email", json={
        "email": unique_email,
        "token": token
    })
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["user"]["is_verified"] is True
    assert "access_token" in v_data

def test_forgot_and_reset_password_flow():
    """Verify forgot password and reset password flow."""
    unique_email = f"reset_test_{uuid.uuid4().hex[:8]}@example.com"
    # Register user first
    reg = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "full_name": "Reset Test User",
        "password": "InitialPassword123!",
        "phone": "+91 99999 77777"
    })
    assert reg.status_code == 201

    # 1. Request forgot password
    res1 = client.post("/api/v1/auth/forgot-password", json={
        "email": unique_email
    })
    assert res1.status_code == 200

    # Retrieve reset token from DB
    db = SessionLocal()
    user = db.query(User).filter(User.email == unique_email).first()
    reset_token = user.reset_password_token
    assert reset_token is not None
    db.close()

    # 2. Reset password
    res2 = client.post("/api/v1/auth/reset-password", json={
        "email": unique_email,
        "token": reset_token,
        "new_password": "NewSecretPassword123!"
    })
    assert res2.status_code == 200

    # 3. Log in with new password
    res3 = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "NewSecretPassword123!"
    })
    assert res3.status_code == 200
    assert "access_token" in res3.json()

def test_admin_worker_provisioning():
    """Verify that an Admin can provision a worker account, while unauthorized users cannot."""
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@connectoo.gov",
        "password": "admin123"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    unique_worker_email = f"worker_{uuid.uuid4().hex[:8]}@connectoo.gov"
    # Provision worker
    worker_res = client.post(
        "/api/v1/admin/workers",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": unique_worker_email,
            "full_name": "Kavita Field Lead",
            "department_id": 1,
            "phone": "+91 98765 99999"
        }
    )
    assert worker_res.status_code == 201
    data = worker_res.json()
    assert data["worker"]["role"] == "worker"
    assert "temporary_password" in data

    # Attempt to provision worker as a citizen -> must fail with 403
    citizen_login = client.post("/api/v1/auth/login", json={
        "email": "citizen@connectoo.gov",
        "password": "citizen123"
    })
    citizen_token = citizen_login.json()["access_token"]
    forbidden_res = client.post(
        "/api/v1/admin/workers",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "email": f"illegal_{uuid.uuid4().hex[:8]}@connectoo.gov",
            "full_name": "Illegal Worker",
            "department_id": 1
        }
    )
    assert forbidden_res.status_code == 403

def test_rbac_complaint_filtering():
    """Verify that citizens only get their own complaints when requesting /complaints/."""
    citizen_login = client.post("/api/v1/auth/login", json={
        "email": "citizen@connectoo.gov",
        "password": "citizen123"
    })
    citizen_token = citizen_login.json()["access_token"]

    res = client.get(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 200
    complaints = res.json()
    db = SessionLocal()
    citizen_user = db.query(User).filter(User.email == "citizen@connectoo.gov").first()
    db.close()
    for c in complaints:
        assert c["citizen_id"] == citizen_user.id

def test_citizen_edit_and_withdraw_complaint():
    """Verify citizen can edit and withdraw a complaint while in SUBMITTED state."""
    citizen_login = client.post("/api/v1/auth/login", json={
        "email": "citizen@connectoo.gov",
        "password": "citizen123"
    })
    citizen_token = citizen_login.json()["access_token"]

    # 1. Create a complaint
    create_res = client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "title": "Broken storm water drain grate on 5th street",
            "description": "The heavy iron drain grate is completely collapsed and posing a severe hazard to two-wheelers.",
            "category_id": 4,
            "latitude": 17.4150,
            "longitude": 78.4350,
            "address": "Road No 5, Banjara Hills",
            "landmark": "Near Apollo Hospital"
        }
    )
    assert create_res.status_code == 201
    complaint_id = create_res.json()["id"]

    # 2. Edit complaint
    edit_res = client.put(
        f"/api/v1/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "title": "Severe collapsed drain grate on 5th street (Updated)",
            "landmark": "Near Apollo Hospital Emergency Entrance"
        }
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["title"] == "Severe collapsed drain grate on 5th street (Updated)"

    # 3. Withdraw complaint
    withdraw_res = client.post(
        f"/api/v1/complaints/{complaint_id}/withdraw",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={"reason": "Resolved by society maintenance team."}
    )
    assert withdraw_res.status_code == 200
    assert withdraw_res.json()["status"] == "Closed"

def test_admin_ai_summarization():
    """Verify AI complaint summarization endpoint."""
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@connectoo.gov",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]

    res = client.post(
        "/api/v1/admin/complaints/1/summarize",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "reported_issue" in data
    assert "impact_assessment" in data
