import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User, UserRole, Department, Ward, Category,
    Complaint, ComplaintStatus, ComplaintPriority,
    ComplaintAssignment, StatusHistory, Comment, Attachment, Feedback, Notification
)

def run_seed():
    print("[INFO] Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@connectoo.gov").first():
            print("Database already contains seed data. Skipping re-seed.")
            return

        print("Creating Departments...")
        departments_data = [
            Department(name="Roads & Infrastructure Department", code="ROADS", description="Pavements, asphalt maintenance, road safety, and bridges", head_email="head.roads@connectoo.gov", phone="+91 40 2345 6701", sla_hours_default=72),
            Department(name="Sanitation & Solid Waste Management", code="SANITATION", description="Garbage collection, waste treatment, debris, and cleanliness", head_email="head.sanitation@connectoo.gov", phone="+91 40 2345 6702", sla_hours_default=24),
            Department(name="Water Supply & Sewerage Board", code="WATER", description="Potable water pipelines, storm drains, and sewage network", head_email="head.water@connectoo.gov", phone="+91 40 2345 6703", sla_hours_default=36),
            Department(name="Electrical & Traffic Engineering", code="ELECTRICAL", description="Streetlights, transformers, traffic signals, and junction cameras", head_email="head.electrical@connectoo.gov", phone="+91 40 2345 6704", sla_hours_default=24),
            Department(name="Horticulture & Parks Department", code="HORTICULTURE", description="Public gardens, tree maintenance, open spaces, and playground equipment", head_email="head.horticulture@connectoo.gov", phone="+91 40 2345 6705", sla_hours_default=48),
            Department(name="Municipal Citizen Services", code="GENERAL", description="Zonal grievances, public encroachments, and general civic welfare", head_email="head.general@connectoo.gov", phone="+91 40 2345 6706", sla_hours_default=48),
        ]
        db.add_all(departments_data)
        db.commit()

        # Map departments by code
        dept_map = {d.code: d for d in db.query(Department).all()}

        print("Creating Municipal Wards...")
        wards_data = [
            Ward(name="Ward 1 - Banjara Hills", code="W01", zone="Central", center_latitude=17.4156, center_longitude=78.4350),
            Ward(name="Ward 2 - Jubilee Hills", code="W02", zone="Central", center_latitude=17.4319, center_longitude=78.4073),
            Ward(name="Ward 3 - Madhapur IT Hub", code="W03", zone="West", center_latitude=17.4483, center_longitude=78.3915),
            Ward(name="Ward 4 - Charminar Old City", code="W04", zone="South", center_latitude=17.3616, center_longitude=78.4747),
            Ward(name="Ward 5 - Secunderabad Station", code="W05", zone="North", center_latitude=17.4399, center_longitude=78.4983),
            Ward(name="Ward 6 - Kukatpally Residential", code="W06", zone="North-West", center_latitude=17.4842, center_longitude=78.4138),
        ]
        db.add_all(wards_data)
        db.commit()
        ward_map = {w.code: w for w in db.query(Ward).all()}

        print("Creating Complaint Categories...")
        categories_data = [
            Category(name="Potholes and damaged roads", slug="potholes-damaged-roads", department_id=dept_map["ROADS"].id, sla_hours=72, icon_name="AlertTriangle", keywords="pothole, asphalt, crater, broken road, ditch, crack"),
            Category(name="Garbage accumulation", slug="garbage-accumulation", department_id=dept_map["SANITATION"].id, sla_hours=24, icon_name="Trash2", keywords="trash, garbage, waste, rotting, dumpster, bin, litter"),
            Category(name="Water leakage and water supply", slug="water-leakage-supply", department_id=dept_map["WATER"].id, sla_hours=24, icon_name="Droplets", keywords="water leak, burst pipe, potable water, contaminated water, tap, pipeline"),
            Category(name="Drainage and sewage problems", slug="drainage-sewage-problems", department_id=dept_map["WATER"].id, sla_hours=36, icon_name="Waves", keywords="sewage, manhole, overflow, dirty water, blocked drain, gutter, odor"),
            Category(name="Broken streetlights", slug="broken-streetlights", department_id=dept_map["ELECTRICAL"].id, sla_hours=24, icon_name="Lightbulb", keywords="streetlight, dark, night, fused bulb, lamp, pole, wire"),
            Category(name="Damaged footpaths", slug="damaged-footpaths", department_id=dept_map["ROADS"].id, sla_hours=96, icon_name="Footprints", keywords="sidewalk, footpath, paver tile, curb, pedestrian pavement"),
            Category(name="Illegal dumping", slug="illegal-dumping", department_id=dept_map["SANITATION"].id, sla_hours=48, icon_name="ShieldAlert", keywords="debris, construction rubble, illegal dumping, vacant plot, concrete waste"),
            Category(name="Public park maintenance", slug="public-park-maintenance", department_id=dept_map["HORTICULTURE"].id, sla_hours=72, icon_name="Trees", keywords="park, garden, swings, overgrown grass, bench, trees"),
            Category(name="Traffic signals and road safety", slug="traffic-signals-safety", department_id=dept_map["ELECTRICAL"].id, sla_hours=16, icon_name="Compass", keywords="traffic signal, red light, traffic jam, zebra crossing, speed breaker, sign board"),
            Category(name="Other civic issues", slug="other-civic-issues", department_id=dept_map["GENERAL"].id, sla_hours=48, icon_name="HelpCircle", keywords="stray dog, noise, encroachment, public nuisance"),
        ]
        db.add_all(categories_data)
        db.commit()
        cat_map = {c.name: c for c in db.query(Category).all()}

        print("Creating Users & User Roles...")
        users_data = [
            # Admin
            User(email="admin@connectoo.gov", hashed_password=get_password_hash("admin123"), full_name="Municipal Commissioner Vikram Rao", phone="+91 98765 00001", role=UserRole.ADMIN, is_active=True, is_verified=True),
            # Citizens
            User(email="citizen@connectoo.gov", hashed_password=get_password_hash("citizen123"), full_name="Priya Sharma", phone="+91 98765 11111", role=UserRole.CITIZEN, is_active=True, is_verified=True),
            User(email="rahul.verma@example.com", hashed_password=get_password_hash("citizen123"), full_name="Rahul Verma", phone="+91 98765 22222", role=UserRole.CITIZEN, is_active=True, is_verified=True),
            User(email="ananya.iyer@example.com", hashed_password=get_password_hash("citizen123"), full_name="Ananya Iyer", phone="+91 98765 33333", role=UserRole.CITIZEN, is_active=True, is_verified=True),
            # Field Workers
            User(email="worker.roads@connectoo.gov", hashed_password=get_password_hash("worker123"), full_name="Suresh Reddy (Roads Officer)", phone="+91 98765 44441", role=UserRole.WORKER, department_id=dept_map["ROADS"].id, is_active=True, is_verified=True),
            User(email="worker.sanitation@connectoo.gov", hashed_password=get_password_hash("worker123"), full_name="Ramesh Kumar (Sanitation Lead)", phone="+91 98765 44442", role=UserRole.WORKER, department_id=dept_map["SANITATION"].id, is_active=True, is_verified=True),
            User(email="worker.water@connectoo.gov", hashed_password=get_password_hash("worker123"), full_name="Anil Rao (Water & Drainage Eng.)", phone="+91 98765 44443", role=UserRole.WORKER, department_id=dept_map["WATER"].id, is_active=True, is_verified=True),
            User(email="worker.electrical@connectoo.gov", hashed_password=get_password_hash("worker123"), full_name="Mohammed Irfan (Electrical Tech)", phone="+91 98765 44444", role=UserRole.WORKER, department_id=dept_map["ELECTRICAL"].id, is_active=True, is_verified=True),
        ]
        db.add_all(users_data)
        db.commit()

        admin_user = db.query(User).filter(User.email == "admin@connectoo.gov").first()
        citizen_priya = db.query(User).filter(User.email == "citizen@connectoo.gov").first()
        citizen_rahul = db.query(User).filter(User.email == "rahul.verma@example.com").first()
        worker_roads = db.query(User).filter(User.email == "worker.roads@connectoo.gov").first()
        worker_sanitation = db.query(User).filter(User.email == "worker.sanitation@connectoo.gov").first()
        worker_water = db.query(User).filter(User.email == "worker.water@connectoo.gov").first()
        worker_electrical = db.query(User).filter(User.email == "worker.electrical@connectoo.gov").first()

        print("Seeding Realistic Civic Complaints...")
        now = datetime.now(timezone.utc)

        complaints_seed = [
            # 1. Pothole - In Progress
            {
                "complaint_id": "CIV-2026-00101",
                "title": "Severe crater pothole near Road No. 10 junction",
                "description": "Deep asphalt crater on the main lane after rain. Multiple two-wheeler riders have suffered near-miss falls and punctured tires.",
                "category": cat_map["Potholes and damaged roads"],
                "department": dept_map["ROADS"],
                "ward": ward_map["W01"],
                "citizen": citizen_priya,
                "assigned_worker": worker_roads,
                "status": ComplaintStatus.IN_PROGRESS,
                "priority": ComplaintPriority.HIGH,
                "lat": 17.4162, "lon": 78.4358,
                "address": "Opposite City Center Mall, Road No. 10, Banjara Hills",
                "landmark": "Near City Center Mall gate",
                "created_offset_days": 2,
                "history_remarks": "Roads maintenance squad dispatched with bitumen cold-mix paver.",
                "has_photo": True
            },
            # 2. Garbage - Submitted
            {
                "complaint_id": "CIV-2026-00102",
                "title": "Uncollected overflowing garbage container at street corner",
                "description": "Garbage has been accumulating near our apartment for three days. Foul odor is spreading and stray cattle are scattering plastic bags.",
                "category": cat_map["Garbage accumulation"],
                "department": dept_map["SANITATION"],
                "ward": ward_map["W02"],
                "citizen": citizen_priya,
                "assigned_worker": None,
                "status": ComplaintStatus.SUBMITTED,
                "priority": ComplaintPriority.MEDIUM,
                "lat": 17.4325, "lon": 78.4082,
                "address": "Crossroad 36, Near Peddamma Temple Arch, Jubilee Hills",
                "landmark": "Beside electric transformer box",
                "created_offset_days": 1,
                "history_remarks": "Citizen filed report. Awaiting admin dispatch.",
                "has_photo": True
            },
            # 3. Water Pipe Burst - Critical, Assigned
            {
                "complaint_id": "CIV-2026-00103",
                "title": "Main drinking water feeder pipeline burst flooding lane",
                "description": "Severe pipeline rupture gushing thousands of gallons of clean drinking water across the road. Risk of water contamination and road wash-away.",
                "category": cat_map["Water leakage and water supply"],
                "department": dept_map["WATER"],
                "ward": ward_map["W03"],
                "citizen": citizen_rahul,
                "assigned_worker": worker_water,
                "status": ComplaintStatus.ASSIGNED,
                "priority": ComplaintPriority.CRITICAL,
                "lat": 17.4491, "lon": 78.3922,
                "address": "Hitec City Road, Cyber Towers Intersection, Madhapur",
                "landmark": "Front of Metro Pillar 1042",
                "created_offset_days": 1,
                "history_remarks": "Assigned with high urgency to emergency valve crew.",
                "has_photo": True
            },
            # 4. Drainage Overflow - Resolved with 5-star Feedback!
            {
                "complaint_id": "CIV-2026-00104",
                "title": "Underground sewer manhole choked and overflowing on sidewalk",
                "description": "Black wastewater spewing onto pedestrian pathway. Stagnant water emitting intolerable odor and posing disease risk.",
                "category": cat_map["Drainage and sewage problems"],
                "department": dept_map["WATER"],
                "ward": ward_map["W04"],
                "citizen": citizen_priya,
                "assigned_worker": worker_water,
                "status": ComplaintStatus.RESOLVED,
                "priority": ComplaintPriority.HIGH,
                "lat": 17.3622, "lon": 78.4752,
                "address": "Near Gulzar Houz Fountain, Charminar Zone",
                "landmark": "Near Gulzar Houz",
                "created_offset_days": 4,
                "history_remarks": "Jetting cum suction machine flushed sewer line. Sludge cleared.",
                "resolved": True,
                "rating": 5,
                "review": "Very fast response! The suction machine arrived within hours and cleared the foul sewage completely."
            },
            # 5. Broken Streetlight - Escalated (Overdue)
            {
                "complaint_id": "CIV-2026-00105",
                "title": "Pitch dark street due to 4 non-working LED poles",
                "description": "Streetlight poles non-functional for past week. Entire alley is completely dark, causing severe safety anxiety for night commuters.",
                "category": cat_map["Broken streetlights"],
                "department": dept_map["ELECTRICAL"],
                "ward": ward_map["W05"],
                "citizen": citizen_rahul,
                "assigned_worker": worker_electrical,
                "status": ComplaintStatus.ESCALATED,
                "priority": ComplaintPriority.HIGH,
                "lat": 17.4410, "lon": 78.4990,
                "address": "Regimental Bazaar Road, Near Secunderabad Railway Station",
                "landmark": "Opposite Railway Reservation Counter",
                "created_offset_days": 5,
                "history_remarks": "Automatic SLA breach escalation triggered. Escalated to Zonal Chief Engineer.",
                "has_photo": True
            },
            # 6. Damaged Footpath - Reopened
            {
                "complaint_id": "CIV-2026-00106",
                "title": "Broken pedestrian sidewalk tiles with exposed rebar",
                "description": "Pavement has caved in near bus stop. Elderly commuters and children tripped. Previous patch collapsed again.",
                "category": cat_map["Damaged footpaths"],
                "department": dept_map["ROADS"],
                "ward": ward_map["W06"],
                "citizen": citizen_priya,
                "assigned_worker": worker_roads,
                "status": ComplaintStatus.REOPENED,
                "priority": ComplaintPriority.MEDIUM,
                "lat": 17.4850, "lon": 78.4145,
                "address": "KPHB Phase 1 Main Road, Near JNTU Bus Stand, Kukatpally",
                "landmark": "Near Bus Shelter",
                "created_offset_days": 6,
                "history_remarks": "Citizen reopened ticket: 'Paving cracked again after heavy rain.'",
                "reopened_count": 1
            },
            # 7. Traffic Signal stuck on Red - In Progress
            {
                "complaint_id": "CIV-2026-00107",
                "title": "Traffic signal malfunctioning at 4-way intersection",
                "description": "Signal controller stuck on red light in two lanes simultaneously, triggering severe 1.5 km vehicular gridlock and honking.",
                "category": cat_map["Traffic signals and road safety"],
                "department": dept_map["ELECTRICAL"],
                "ward": ward_map["W03"],
                "citizen": citizen_rahul,
                "assigned_worker": worker_electrical,
                "status": ComplaintStatus.IN_PROGRESS,
                "priority": ComplaintPriority.CRITICAL,
                "lat": 17.4475, "lon": 78.3930,
                "address": "Inorbit Mall Crossroad, Durgam Cheruvu Connector, Madhapur",
                "landmark": "Near Inorbit Mall Entry",
                "created_offset_days": 1,
                "history_remarks": "Signal technician on-site replacing damaged microprocessor PLC board."
            },
            # 8. Illegal Construction Dumping - Under Review
            {
                "complaint_id": "CIV-2026-00108",
                "title": "Commercial dump truck dumped concrete debris in open park buffer",
                "description": "Heavy commercial trucks unloaded tons of broken masonry, brick rubble, and plaster in open municipal land during late night.",
                "category": cat_map["Illegal dumping"],
                "department": dept_map["SANITATION"],
                "ward": ward_map["W02"],
                "citizen": citizen_priya,
                "assigned_worker": None,
                "status": ComplaintStatus.UNDER_REVIEW,
                "priority": ComplaintPriority.MEDIUM,
                "lat": 17.4330, "lon": 78.4060,
                "address": "Road 45 Ext, Near Jubilee Hills Checkpost",
                "landmark": "Vacant municipal parcel adjacent to park",
                "created_offset_days": 2,
                "history_remarks": "Municipal vigilance unit verifying CCTV footage to identify vehicle registration."
            },
            # 9. Park Maintenance - Closed
            {
                "complaint_id": "CIV-2026-00109",
                "title": "Broken children swing set and overgrown thorny shrubs",
                "description": "Colony park playground equipment was broken with sharp metal edges. Shrubbery needed pruning.",
                "category": cat_map["Public park maintenance"],
                "department": dept_map["HORTICULTURE"],
                "ward": ward_map["W01"],
                "citizen": citizen_priya,
                "assigned_worker": None,
                "status": ComplaintStatus.CLOSED,
                "priority": ComplaintPriority.LOW,
                "lat": 17.4140, "lon": 78.4340,
                "address": "Green Park Colony Garden, Banjara Hills",
                "landmark": "Inside Colony Park",
                "created_offset_days": 8,
                "history_remarks": "Swings re-welded and painted. Horticulture staff pruned hedges.",
                "resolved": True,
                "rating": 4,
                "review": "Park is clean and safe for children once again. Good work by the gardening team."
            },
            # 10. Stray Dog Menace / Animal Welfare - Assigned
            {
                "complaint_id": "CIV-2026-00110",
                "title": "Aggressive pack of stray dogs chasing school children",
                "description": "Pack of 7 stray dogs exhibiting aggressive behavior, barking at cyclists and delivery persons near morning school bus stop.",
                "category": cat_map["Other civic issues"],
                "department": dept_map["GENERAL"],
                "ward": ward_map["W05"],
                "citizen": citizen_rahul,
                "assigned_worker": None,
                "status": ComplaintStatus.ASSIGNED,
                "priority": ComplaintPriority.MEDIUM,
                "lat": 17.4380, "lon": 78.4970,
                "address": "Clock Tower Road, Shivaji Nagar, Secunderabad",
                "landmark": "Near St. Ann's High School gate",
                "created_offset_days": 2,
                "history_remarks": "Veterinary animal care van notified for vaccination and ABC check."
            }
        ]

        for s in complaints_seed:
            created_dt = now - timedelta(days=s["created_offset_days"], hours=4)
            expected_sla = created_dt + timedelta(hours=s["category"].sla_hours)

            comp = Complaint(
                complaint_id=s["complaint_id"],
                title=s["title"],
                description=s["description"],
                original_language="en",
                category_id=s["category"].id,
                department_id=s["department"].id,
                ward_id=s["ward"].id,
                citizen_id=s["citizen"].id,
                assigned_worker_id=s["assigned_worker"].id if s["assigned_worker"] else None,
                status=s["status"],
                priority=s["priority"],
                latitude=s["lat"],
                longitude=s["lon"],
                address=s["address"],
                landmark=s["landmark"],
                ai_category_suggested=s["category"].name,
                ai_severity_suggested=s["priority"].value,
                ai_confidence_score=0.91,
                ai_reasoning=f"Classified under {s['category'].name} based on reported impact. Priority assigned {s['priority'].value}.",
                ai_estimated_hours=float(s["category"].sla_hours),
                expected_resolution_at=expected_sla,
                resolved_at=(created_dt + timedelta(hours=18)) if s.get("resolved") else None,
                closed_at=(created_dt + timedelta(hours=22)) if s["status"] == ComplaintStatus.CLOSED else None,
                reopened_count=s.get("reopened_count", 0),
                created_at=created_dt,
                updated_at=now
            )
            db.add(comp)
            db.commit()
            db.refresh(comp)

            # Add status history
            hist_init = StatusHistory(
                complaint_id=comp.id,
                old_status=None,
                new_status=ComplaintStatus.SUBMITTED.value,
                changed_by_id=s["citizen"].id,
                remarks="Citizen submitted report via web portal.",
                created_at=created_dt
            )
            db.add(hist_init)

            if s["status"] != ComplaintStatus.SUBMITTED:
                hist_current = StatusHistory(
                    complaint_id=comp.id,
                    old_status=ComplaintStatus.SUBMITTED.value,
                    new_status=s["status"].value,
                    changed_by_id=admin_user.id,
                    remarks=s["history_remarks"],
                    created_at=created_dt + timedelta(hours=2)
                )
                db.add(hist_current)

            # Add comments
            comm = Comment(
                complaint_id=comp.id,
                user_id=s["citizen"].id,
                content=f"Reported issue location is clearly marked with landmarks. Urgent attention requested.",
                created_at=created_dt + timedelta(minutes=15)
            )
            db.add(comm)

            # Add Feedback if resolved
            if s.get("resolved") and s.get("rating"):
                fb = Feedback(
                    complaint_id=comp.id,
                    citizen_id=s["citizen"].id,
                    rating=s["rating"],
                    review_text=s.get("review", "Work completed effectively."),
                    created_at=created_dt + timedelta(hours=20)
                )
                db.add(fb)

            # Add Notification
            notif = Notification(
                user_id=s["citizen"].id,
                complaint_id=comp.id,
                title=f"Update on {comp.complaint_id}",
                message=f"Current status: {comp.status.value}. {s['history_remarks']}",
                type="status_update",
                is_read=False,
                created_at=created_dt + timedelta(hours=3)
            )
            db.add(notif)

        db.commit()
        print("[SUCCESS] Database seeding completed successfully with 10 realistic civic complaints and demo accounts!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
