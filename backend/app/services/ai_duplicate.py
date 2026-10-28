import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models.models import Complaint, ComplaintStatus

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class AIDuplicateDetector:
    def __init__(self, max_distance_meters: float = 350.0, similarity_threshold: float = 0.50):
        self.max_distance = max_distance_meters
        self.similarity_threshold = similarity_threshold

    def find_potential_duplicates(
        self,
        db: Session,
        title: str,
        description: str,
        category_id: int,
        latitude: float,
        longitude: float,
        exclude_id: Optional[int] = None
    ) -> Dict[str, Any]:
        # Query active complaints in the same or related categories (excluding rejected/closed if older than 30 days)
        query = db.query(Complaint).filter(
            Complaint.status.notin_([ComplaintStatus.REJECTED, ComplaintStatus.CLOSED])
        )
        if exclude_id:
            query = query.filter(Complaint.id != exclude_id)
        
        candidates = query.all()
        if not candidates:
            return {
                "is_likely_duplicate": False,
                "highest_score": 0.0,
                "potential_duplicates": []
            }

        input_text = f"{title} {description}"
        potential_matches = []

        for candidate in candidates:
            # 1. Geographic distance check
            dist_meters = haversine_distance_meters(
                latitude, longitude, candidate.latitude, candidate.longitude
            )

            # Proximity weighting: if within 300 meters, proximity factor is high
            if dist_meters > 500:
                continue

            # 2. Text similarity check
            candidate_text = f"{candidate.title} {candidate.description}"
            try:
                tfidf = TfidfVectorizer(stop_words='english')
                tfidf_matrix = tfidf.fit_transform([input_text, candidate_text])
                text_sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            except Exception:
                text_sim = 0.0

            # 3. Category match boost
            category_match = (candidate.category_id == category_id)
            cat_bonus = 0.15 if category_match else 0.0

            # Proximity factor: 1.0 at 0m, decaying to 0.0 at 500m
            geo_factor = max(0.0, 1.0 - (dist_meters / 500.0))

            # Composite match score
            combined_score = (text_sim * 0.50) + (geo_factor * 0.35) + cat_bonus
            combined_score = round(min(0.99, combined_score), 2)

            if combined_score >= self.similarity_threshold or (dist_meters < 75 and text_sim > 0.30):
                potential_matches.append({
                    "id": candidate.id,
                    "complaint_id": candidate.complaint_id,
                    "title": candidate.title,
                    "category_name": candidate.category.name if candidate.category else "General",
                    "similarity_score": combined_score,
                    "distance_meters": round(dist_meters, 1),
                    "status": candidate.status.value,
                    "created_at": candidate.created_at
                })

        # Sort matches by highest similarity score
        potential_matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        highest = potential_matches[0]["similarity_score"] if potential_matches else 0.0

        return {
            "is_likely_duplicate": len(potential_matches) > 0 and highest >= 0.60,
            "highest_score": highest,
            "potential_duplicates": potential_matches[:5]
        }

duplicate_detector_service = AIDuplicateDetector()
