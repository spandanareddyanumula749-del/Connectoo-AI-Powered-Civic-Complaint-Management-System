import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import User, Complaint, UserRole

class AICivicChatbot:
    def process_query(self, message: str, user: Optional[User] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        msg_lower = message.strip().lower()

        # Check for complaint ID tracking query (e.g. CIV-2026-00101 or "track my complaint")
        complaint_id_match = re.search(r"\b(civ-\d{4}-\d{5})\b", msg_lower, re.IGNORECASE)

        if complaint_id_match:
            cid = complaint_id_match.group(1).upper()
            if not db:
                return {
                    "reply": f"Found reference to {cid}. Please log in or refresh to query live database records.",
                    "suggested_actions": ["Log in to view complaints", "Visit complaint tracking page"],
                    "related_complaint_id": cid
                }
            complaint = db.query(Complaint).filter(Complaint.complaint_id == cid).first()
            if not complaint:
                return {
                    "reply": f"No complaint found matching ID **{cid}**. Please verify your ticket number.",
                    "suggested_actions": ["Search tracking page", "View my complaints"],
                    "related_complaint_id": None
                }

            # Enforce privacy check: if not admin or assigned worker or owner citizen, mask private details
            is_authorized = False
            if user:
                if user.role == UserRole.ADMIN or user.id == complaint.citizen_id or user.id == complaint.assigned_worker_id:
                    is_authorized = True

            if not is_authorized and user:
                return {
                    "reply": f"Complaint **{cid}** exists in our municipal records. However, because you are not the registered filer or assigned officer, detailed private address and citizen details are protected. Status: **{complaint.status.value}** in {complaint.category.name if complaint.category else 'Civic Department'}.",
                    "suggested_actions": ["Go to Complaint Tracker"],
                    "related_complaint_id": cid
                }

            reply = (
                f"**Complaint Details: {cid}**\n"
                f"- **Title:** {complaint.title}\n"
                f"- **Status:** {complaint.status.value}\n"
                f"- **Priority:** {complaint.priority.value}\n"
                f"- **Category:** {complaint.category.name if complaint.category else 'General'}\n"
                f"- **Department:** {complaint.department.name if complaint.department else 'Municipal Office'}\n"
                f"- **Location:** {complaint.address}\n"
                f"- **Submitted:** {complaint.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            )
            if complaint.assigned_worker:
                reply += f"- **Assigned Officer:** {complaint.assigned_worker.full_name}\n"
            if complaint.expected_resolution_at:
                reply += f"- **SLA Target:** {complaint.expected_resolution_at.strftime('%Y-%m-%d %H:%M')}\n"

            return {
                "reply": reply,
                "suggested_actions": ["Open complaint details", "Add comment or evidence", "Track live timeline"],
                "related_complaint_id": cid
            }

        # Check user asking for their own complaints
        if ("my complaint" in msg_lower or "my tickets" in msg_lower or "complaints i filed" in msg_lower):
            if not user or not db:
                return {
                    "reply": "To view your submitted complaints, please log in to your Connectoo account. You can track all active and resolved issues on your Citizen Dashboard.",
                    "suggested_actions": ["Go to Login", "Register as Citizen"],
                    "related_complaint_id": None
                }
            user_complaints = db.query(Complaint).filter(Complaint.citizen_id == user.id).order_by(Complaint.created_at.desc()).limit(3).all()
            if not user_complaints:
                return {
                    "reply": f"Hello {user.full_name}! You currently have no complaints on file. If you see any civic issues in your neighborhood, click **Report a Problem** to submit one with location and photo.",
                    "suggested_actions": ["Report a Civic Issue", "Explore City Map"],
                    "related_complaint_id": None
                }
            items_str = "\n".join([f"- **{c.complaint_id}**: {c.title} (Status: *{c.status.value}*)" for c in user_complaints])
            return {
                "reply": f"Hello {user.full_name}! Here are your recent complaints:\n{items_str}\n\nYou can view full details or post follow-ups on your dashboard.",
                "suggested_actions": ["View Citizen Dashboard", "Report New Issue"],
                "related_complaint_id": user_complaints[0].complaint_id
            }

        # Knowledge Base answers
        if any(w in msg_lower for w in ["how do i report", "how to report", "file a complaint", "submit issue"]):
            return {
                "reply": (
                    "**To report a civic problem on Connectoo:**\n"
                    "1. Click the **'Report a Problem'** button in the navigation or dashboard.\n"
                    "2. Enter a descriptive title and detailed summary of the issue.\n"
                    "3. Our AI will automatically suggest the right category, department, and priority level.\n"
                    "4. Upload a photograph of the problem (our Computer Vision model will verify the issue).\n"
                    "5. Pinpoint the exact location on the interactive OpenStreetMap picker.\n"
                    "6. Submit! You will immediately receive a unique tracking ID (e.g. `CIV-2026-XXXXX`)."
                ),
                "suggested_actions": ["Open Report Form", "View Categories", "Check Duplicate Warnings"],
                "related_complaint_id": None
            }

        if any(w in msg_lower for w in ["which category", "category", "categories", "what category"]):
            return {
                "reply": (
                    "Connectoo supports 10 municipal categories:\n"
                    "1. **Potholes and damaged roads** (Asphalt craters, cracks)\n"
                    "2. **Garbage accumulation** (Overflowing bins, trash heaps)\n"
                    "3. **Water leakage and water supply** (Pipe bursts, low pressure)\n"
                    "4. **Drainage and sewage problems** (Choked manholes, overflowing drains)\n"
                    "5. **Broken streetlights** (Fused lamps, dark streets, loose wiring)\n"
                    "6. **Damaged footpaths** (Missing paver blocks, broken curbs)\n"
                    "7. **Illegal dumping** (Construction rubble, chemical waste)\n"
                    "8. **Public park maintenance** (Broken playground equipment, fallen branches)\n"
                    "9. **Traffic signals and road safety** (Non-working signals, missing signboards)\n"
                    "10. **Other civic issues** (Encroachments, noise pollution, animal welfare)\n\n"
                    "*Tip: When you type your issue description, our AI will recommend the exact category for you!*"
                ),
                "suggested_actions": ["Report an Issue", "View Map by Category"],
                "related_complaint_id": None
            }

        if any(w in msg_lower for w in ["status mean", "statuses", "what does status"]):
            return {
                "reply": (
                    "**Connectoo Complaint Status Lifecycle:**\n"
                    "- **Submitted**: Complaint recorded and queued for automated AI validation.\n"
                    "- **Under Review**: Municipal desk is verifying jurisdiction and duplicate checks.\n"
                    "- **Assigned**: Dispatched to the relevant department and field worker.\n"
                    "- **In Progress**: Field technician is on-site actively conducting repairs.\n"
                    "- **Resolved**: Work completed with photographic evidence submitted.\n"
                    "- **Closed**: Verified and confirmed by citizen or department after feedback.\n"
                    "- **Reopened**: Re-activated by citizen if the problem re-occurred.\n"
                    "- **Escalated**: Auto-escalated to senior zonal engineer due to SLA timeout.\n"
                    "- **Rejected**: Deemed invalid or out of municipal jurisdiction with explanation."
                ),
                "suggested_actions": ["Track a Complaint", "View SLA Guidelines"],
                "related_complaint_id": None
            }

        if any(w in msg_lower for w in ["what should i include", "include", "photograph", "evidence"]):
            return {
                "reply": (
                    "**To ensure fastest resolution, include:**\n"
                    "1. **A clear photograph**: Clear daylight photo showing the problem in context.\n"
                    "2. **Exact location**: Use the map marker pin and note prominent nearby landmarks.\n"
                    "3. **Safety impact**: Mention if there are hazards like live wires, deep holes, or proximity to schools/hospitals.\n"
                    "4. **Duration**: State how long the issue has persisted (e.g. 'accumulating for 3 days')."
                ),
                "suggested_actions": ["Report Problem Now", "Take a Photo"],
                "related_complaint_id": None
            }

        # Default intelligent civic greeting
        return {
            "reply": (
                "Hello! I am **Connectoo Assistant**, your 24/7 municipal helper. "
                "You can ask me how to report problems, query category guidelines, understand complaint statuses, "
                "or track your ticket status by typing its ID (e.g. `CIV-2026-00101`). How can I assist you today?"
            ),
            "suggested_actions": [
                "How do I report a pothole?",
                "Which category should I choose?",
                "What does my complaint status mean?",
                "What should I include in my report?"
            ],
            "related_complaint_id": None
        }

chatbot_service = AICivicChatbot()
