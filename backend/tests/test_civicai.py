import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.models import User, Complaint, ComplaintStatus, ComplaintPriority

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_admin():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@connectoo.gov", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_login_citizen():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen@connectoo.gov", "password": "citizen123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "citizen"

def test_login_invalid():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@connectoo.gov", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_ai_classification_api():
    # Test Garbage report classification
    resp = client.post(
        "/api/v1/ai/classify",
        json={"text": "Garbage has been accumulating near our apartment for three days, smelling terrible"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["suggested_category_name"] == "Garbage accumulation"
    assert "Sanitation" in data["suggested_department_name"]
    assert data["confidence"] > 0.50

def test_ai_severity_api():
    # Critical hazard test
    resp = client.post(
        "/api/v1/ai/severity",
        json={
            "title": "Live wire sparking near open school gate",
            "description": "Exposed high voltage wire fell down and sparking on water puddle, extreme electrocution hazard for children!"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["severity"] in ["High", "Critical"]
    assert len(data["risk_factors"]) > 0

def test_complaint_submission_workflow():
    # 1. Login as Citizen
    auth_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen@connectoo.gov", "password": "citizen123"}
    )
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Submit Complaint
    complaint_payload = {
        "title": "Deep asphalt pothole near bus terminal entrance",
        "description": "Massive crater on the road causing traffic blockage and bike accidents after heavy monsoon showers.",
        "category_id": 1,
        "ward_id": 1,
        "latitude": 17.4170,
        "longitude": 78.4360,
        "address": "Banjara Hills Bus Terminal Road",
        "landmark": "Near Gate 2"
    }

    create_resp = client.post("/api/v1/complaints/", json=complaint_payload, headers=headers)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["complaint_id"].startswith("CIV-")
    assert created_data["status"] == "Submitted"
    assert created_data["ai_category_suggested"] is not None
    assert created_data["expected_resolution_at"] is not None

    cid = created_data["id"]
    complaint_code = created_data["complaint_id"]

    # 3. Track Complaint by Code
    track_resp = client.get(f"/api/v1/complaints/track/{complaint_code}")
    assert track_resp.status_code == 200
    assert track_resp.json()["id"] == cid

    # 4. Detail View with timeline
    detail_resp = client.get(f"/api/v1/complaints/{cid}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert len(detail_data["status_history"]) >= 1

def test_admin_assignment_workflow():
    # 1. Admin login
    admin_auth = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@connectoo.gov", "password": "admin123"}
    )
    admin_token = admin_auth.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Get list of complaints
    complaints_resp = client.get("/api/v1/complaints/?limit=10", headers=admin_headers)
    assert complaints_resp.status_code == 200
    complaints = complaints_resp.json()
    assert len(complaints) > 0
    target_complaint = complaints[0]

    # 3. Get Worker
    users_resp = client.get("/api/v1/auth/users?role=worker", headers=admin_headers)
    assert users_resp.status_code == 200
    workers = users_resp.json()
    assert len(workers) > 0
    worker = workers[0]

    # 4. Assign complaint to worker
    assign_resp = client.post(
        f"/api/v1/admin/complaints/{target_complaint['id']}/assign",
        json={"worker_id": worker["id"], "notes": "Urgent attention required by supervisor."},
        headers=admin_headers
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["assigned_worker_id"] == worker["id"]
    assert assign_resp.json()["status"] == "Assigned"

def test_worker_permissions_and_completion():
    # 1. Login as Worker
    worker_auth = client.post(
        "/api/v1/auth/login",
        json={"email": "worker.roads@connectoo.gov", "password": "worker123"}
    )
    worker_token = worker_auth.json()["access_token"]
    worker_headers = {"Authorization": f"Bearer {worker_token}"}

    # 2. Get Worker Tasks
    tasks_resp = client.get("/api/v1/worker/tasks", headers=worker_headers)
    assert tasks_resp.status_code == 200
    tasks = tasks_resp.json()

    if tasks:
        task = tasks[0]
        # Start Task
        if task["status"] in ["Assigned", "Reopened", "Escalated"]:
            start_resp = client.patch(f"/api/v1/worker/tasks/{task['id']}/start", headers=worker_headers)
            assert start_resp.status_code == 200
            assert start_resp.json()["status"] == "In Progress"

        # Complete Task
        comp_resp = client.post(
            f"/api/v1/worker/tasks/{task['id']}/complete",
            data={"resolution_notes": "Repairs finalized with high-grade asphalt mix and steam-rolled."},
            headers=worker_headers
        )
        assert comp_resp.status_code == 200
        assert comp_resp.json()["status"] == "Resolved"

def test_analytics_metrics_and_csv():
    # 1. Summary Metrics
    resp = client.get("/api/v1/analytics/summary")
    assert resp.status_code == 200
    metrics = resp.json()
    assert metrics["total_complaints"] >= 10
    assert "average_resolution_hours" in metrics
    assert "citizen_satisfaction_score" in metrics

    # 2. Charts Data
    chart_resp = client.get("/api/v1/analytics/charts")
    assert chart_resp.status_code == 200
    charts = chart_resp.json()
    assert "by_category" in charts
    assert "department_performance" in charts

    # 3. CSV Export (Admin only)
    admin_auth = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@connectoo.gov", "password": "admin123"}
    )
    admin_headers = {"Authorization": f"Bearer {admin_auth.json()['access_token']}"}
    csv_resp = client.get("/api/v1/analytics/export-csv", headers=admin_headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Complaint ID,Title" in csv_resp.text

def test_civic_chatbot():
    # Test knowledge base reply
    resp = client.post("/api/v1/chat/", json={"message": "How do I report a pothole?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "Report a Problem" in data["reply"]
    assert len(data["suggested_actions"]) > 0

    # Test complaint tracking via chat
    resp_track = client.post("/api/v1/chat/", json={"message": "Status of CIV-2026-00101"})
    assert resp_track.status_code == 200
    assert "CIV-2026-00101" in resp_track.json()["reply"]
