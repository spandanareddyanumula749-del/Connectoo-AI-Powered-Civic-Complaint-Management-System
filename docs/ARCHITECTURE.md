# Connectoo – System Architecture & Developer Guide

## Overview
Connectoo is an AI-powered municipal civic issue reporting, automated triage, and resolution platform.
It connects Citizens, Municipal Administrators, and Field Workers in a seamless workflow.

## Directory Structure
- `backend/`: FastAPI backend service with SQLAlchemy 2.0 ORM, JWT authentication, and AI classification services.
  - `app/api/v1/`: Endpoints for auth, complaints, admin, worker, AI, analytics, notifications, and feedback.
  - `app/core/`: Configuration, security, database session management, and migrations.
  - `app/models/`: Database models for Users, Complaints, Departments, Audit Logs, and Notifications.
  - `app/schemas/`: Pydantic request and response schemas.
  - `app/services/`: AI triage, duplicate detection, severity assessment, SLA calculation, and email service.
  - `connectoo.db`: Pre-seeded SQLite database with demo accounts.
  - `seed.py`: Database seeding script.
  - `main.py`: FastAPI application entrypoint.
- `frontend/`: React 19 + TypeScript single-page application built with Vite and Tailwind CSS.
  - `src/components/`: Reusable UI components (Navbar, Sidebar, MapPicker, CivicMapView, ChatWidget).
  - `src/contexts/`: React contexts for Authentication, Notifications, and Theme.
  - `src/pages/`: Dashboards (Citizen, Admin, Worker) and reporting pages.
  - `src/services/api.ts`: Centralized Axios client with automatic bearer token handling.
- `uploads/`: Directory for citizen complaint attachments and worker resolution photos.
- `docs/`: Technical documentation and setup guides.
- `start.bat`: One-click startup script for Windows.
- `docker-compose.yml`: Multi-container Docker configuration.

## Quick Start
Run `start.bat` on Windows or:
1. Backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
   pip install -r requirements.txt
   python seed.py
   uvicorn main:app --reload
   ```
2. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Demo Credentials
- Administrator: `admin@connectoo.gov` / `admin123`
- Citizen: `citizen@connectoo.gov` / `citizen123`
- Worker (Roads): `worker.roads@connectoo.gov` / `worker123`
- Worker (Sanitation): `worker.sanitation@connectoo.gov` / `worker123`
