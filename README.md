# Connectoo – AI-Powered Civic Management System

**Connectoo** is a modern, responsive, full-stack civic infrastructure management and reporting platform. It bridges the gap between citizens and municipal authorities to report, track, manage, and resolve public infrastructure issues (potholes, garbage accumulation, pipe bursts, defective streetlights, and drainage hazards) through machine learning triage, genuine cryptographic email verification, and role-based data isolation.

Designed with a minimal pastel aesthetic (`#FAF9F6` off-white, `#DCE9DF` soft sage, `#315C4B` dark forest green, `#29332F` dark charcoal).

---

## 🏛️ Key Capabilities

- **Three Dedicated User Roles**:
  - **Citizen**: Register and verify email, submit civic complaints with photographs and map coordinates, view personal complaint history, edit or withdraw tickets in submitted state, rate completed resolutions (1–5 stars + review), and chat with the 24/7 AI civic assistant.
  - **Municipal Administrator**: Executive dashboard with live database telemetry, Recharts analytics, complaint triage and dispatch, priority overrides, duplicate clustering, SLA breach escalation sweeps, field worker provisioning, and executive AI complaint summarization.
  - **Field Worker**: Duty roster with assigned tasks, GPS map coordinates, status updates (`In Progress`), before-and-after photograph uploads, and completion evidence submission.

- **Real AI & Machine Learning Subsystems**:
  - **Automated Complaint Classification**: Scikit-Learn TF-IDF + Multinomial Naive Bayes pipeline trained on municipal complaint records across 10 civic categories, outputting category, department, and confidence score.
  - **AI Severity Prediction**: Multi-factor signal analysis detecting life-safety risks (electrocution, open manholes, flooding, school/hospital proximity) to rank priority (`Low`, `Medium`, `High`, `Critical`) with transparent reasoning.
  - **Geo-Spatial Duplicate Detection**: Combines Haversine spatial distance ($\le 250\text{m}$) with TF-IDF text cosine similarity to identify related tickets within 250 meters.
  - **Computer Vision Issue Recognition**: Lightweight visual feature and edge roughness analyzer categorizing uploaded photographs into detected issue tags.
  - **Resolution Time Estimator**: Mathematical and heuristic regression calculating expected duration factoring category baseline, urgency, and active department worker backlog.
  - **Executive AI Complaint Summarizer**: Generates concise action briefs for administrators reviewing complex citizen complaints.
  - **Multilingual Support**: Supports English, Hindi (हिंदी), and Telugu (తెలుగు) with language identification.
  - **AI Civic Chatbot**: 24/7 digital concierge answering FAQs, category guidelines, status definitions, and authenticated complaint status lookups.

---

## 💻 Technology Stack

### Backend
- **Framework**: Python 3.13+, FastAPI, Uvicorn
- **ORM & Database**: SQLAlchemy 2.0 (Zero-config SQLite with automated column migration; PostgreSQL production-ready)
- **Validation**: Pydantic V2, Pydantic-Settings
- **Security**: JWT (`pyjwt`), Bcrypt password hashing (`bcrypt`)
- **Email Service**: Multi-transport EmailService (SMTP TLS + Local Development Console Fallback)
- **Machine Learning**: Scikit-learn, NumPy, Pandas, Pillow
- **Testing**: Pytest, HTTPX

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with custom Minimal Pastel Design System
- **Icons**: Lucide React
- **Maps**: Leaflet, React-Leaflet, OpenStreetMap
- **Data Visualization**: Recharts
- **UX & Utilities**: Canvas-Confetti, Axios, React Router v6

---

## 🚀 Quick Start Guide (Windows)

### Option 1: One-Click Launcher
Double-click `start.bat` in the project root:
```powershell
.\start.bat
```
*This will verify dependencies, start FastAPI on `http://127.0.0.1:8000`, start Vite on `http://localhost:5173`, and open your browser automatically.*

---

### Option 2: Manual Terminal Execution

#### 1. Backend Setup & Launch
Open a terminal in `backend/`:
```powershell
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Seed initial database (departments, wards, categories, users)
python seed.py

# Run tests
pytest -v tests/

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Interactive Swagger documentation: **http://127.0.0.1:8000/docs**.*

#### 2. Frontend Setup & Launch
Open a second terminal in `frontend/`:
```powershell
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start Vite development server
npm run dev
```
*Frontend runs at: **http://localhost:5173** (or http://localhost:5174).*

---

## 🔑 Demo Account Credentials

Use the **Demo Persona Switcher** dropdown in the top navbar or log in with these pre-seeded accounts:

| Role | Email | Password | Full Name & Purpose |
|---|---|---|---|
| **Municipal Admin** | `admin@connectoo.gov` | `admin123` | Commissioner Vikram Rao (Dispatch & Analytics) |
| **Citizen (Filer)** | `citizen@connectoo.gov` | `citizen123` | Priya Sharma (Report, Track & Feedback) |
| **Field Worker (Roads)** | `worker.roads@connectoo.gov` | `worker123` | Suresh Reddy (Roads Officer) |
| **Field Worker (Sanitation)**| `worker.sanitation@connectoo.gov` | `worker123` | Ramesh Kumar (Solid Waste Lead) |
| **Field Worker (Water)** | `worker.water@connectoo.gov` | `worker123` | Anil Rao (Water & Sewerage Eng.) |
| **Field Worker (Electrical)**| `worker.electrical@connectoo.gov`| `worker123` | Mohammed Irfan (Electrical Tech) |

---

## 📧 Real Email Delivery Configuration

In `backend/.env` (or root `.env`), configure standard SMTP parameters:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="noreply@connectoo.gov"
SMTP_FROM_NAME="Connectoo Municipal Platform"
SMTP_TLS=true
FRONTEND_URL="http://localhost:5173"
REQUIRE_EMAIL_VERIFICATION=true
```

> **Development Mode Note**: When `SMTP_HOST` is left unset, verification and password reset links are printed cleanly to the backend server terminal and log, allowing offline testing without setting up a mail server.

---

## 🛡️ Initial Administrator Setup via CLI

To create a new administrator account securely without public registration:
```powershell
cd backend
.\venv\Scripts\python create_admin.py --email admin@connectoo.gov --name "Municipal Administrator" --password "YourStrongPassword123!"
```

---

## 📑 Application Routes Overview

1. **Public Landing Page** (`/`): Mission overview, live database metrics, 4-step workflow, and feature cards.
2. **Login Page** (`/login`): 2-column sign-in with show/hide password, 30-day remember-me, and demo persona quick-fill.
3. **Register Page** (`/register`): Citizen-only registration with password confirmation and verification notices.
4. **Verify Email** (`/verify-email`): Token-based verification via URL or manual token entry.
5. **Forgot Password** (`/forgot-password`): Secure email recovery request.
6. **Reset Password** (`/reset-password`): Cryptographic token password update.
7. **Citizen Dashboard** (`/citizen`): Personal complaint summary cards, edit ticket, withdraw ticket, and timeline links.
8. **Report an Issue** (`/report`): AI category suggestion, urgency scoring, photo analysis, map pin, and duplicate warnings.
9. **Complaint Tracking** (`/track`): Public ticket tracking with citizen privacy masking.
10. **Complaint Details & Timeline** (`/complaints/:id`): Full ticket metadata, executive AI summarizer, before/after photos, status history, and comments.
11. **Interactive Civic Map** (`/map`): Leaflet OpenStreetMap with severity color-coded pins and category filters.
12. **AI Civic Chatbot** (`/chat`): Conversational digital concierge with suggestion pills and ticket status search.
13. **Municipal Admin Command** (`/admin`): Real-time metrics, Recharts visualizations, and SLA breach trigger.
14. **Complaint Management & Dispatch** (`/admin/complaints`): Filterable data table, worker assignment, and status override dialog.
15. **Departments & Staff Roster** (`/admin/departments`): Department cards, Field Worker Provisioning modal with auto-generated temporary passwords, and status toggle.
16. **Predictive Analytics & Reports** (`/admin/analytics`): Predictive hotspots, seasonal surge projections, and CSV export.
17. **Field Worker Console** (`/worker`): Assigned work orders, status updater (`In Progress` $\to$ `Resolved`), and before/after evidence upload.
18. **Notification Center** (`/notifications`): In-app alerts for status updates and escalations.
19. **User Profile & Settings** (`/profile`): Personal profile, 1-click persona switcher, and light/dark theme toggle.
# Connectoo-AI-Powered-Civic-Complaint-Management-System
CI/CD webhook test
CI/CD webhook test
Automatic ci/cd
CI/CD Pipeline
CI/CD Pipeline
automatic testing
automation
building
automation
