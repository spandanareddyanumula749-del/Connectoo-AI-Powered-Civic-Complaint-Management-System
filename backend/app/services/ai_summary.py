import re
from typing import Dict, Any, List

class AIComplaintSummarizer:
    def summarize(self, text: str) -> Dict[str, Any]:
        cleaned = text.strip()
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", cleaned) if len(s.strip()) > 3]

        # Extract issue sentence (usually the first sentence or one containing key nouns)
        reported_issue = sentences[0] if sentences else "Civic issue reported."
        
        # Look for location clues
        location_clues = []
        loc_patterns = [
            r"\b(near|at|opposite|behind|next to|beside|in front of|across|junction|corner|lane|street|road|ward|block|apartment)\s+([A-Za-z0-9\s,-]+)",
        ]
        for pat in loc_patterns:
            m = re.findall(pat, cleaned, re.IGNORECASE)
            for match in m:
                if isinstance(match, tuple):
                    phrase = f"{match[0]} {match[1].strip()}"
                    location_clues.append(phrase[:60])

        loc_str = "; ".join(location_clues[:2]) if location_clues else "Location details provided via map coordinates"

        # Look for impact descriptions
        impact_clues = []
        if re.search(r"\b(accident|injury|puncture|fall|slip|hazard|danger|threat|damage)\b", cleaned, re.IGNORECASE):
            impact_clues.append("Physical safety / accident risk")
        if re.search(r"\b(traffic|jam|congestion|gridlock|delay|blocked)\b", cleaned, re.IGNORECASE):
            impact_clues.append("Vehicular traffic hindrance")
        if re.search(r"\b(smell|stink|odor|mosquito|health|disease|contamination)\b", cleaned, re.IGNORECASE):
            impact_clues.append("Sanitation and public health risk")
        if re.search(r"\b(dark|blackout|night|unsafe)\b", cleaned, re.IGNORECASE):
            impact_clues.append("Nighttime pedestrian insecurity")

        impact_str = ", ".join(impact_clues) if impact_clues else "Standard residential convenience impact"

        # Missing information checks
        missing_info = []
        if not location_clues and not re.search(r"\b(street|road|near|colony|nagar|apartment|block)\b", cleaned, re.IGNORECASE):
            missing_info.append("Precise landmark or physical street reference")
        if not re.search(r"\b(\d+\s*(day|week|month|hour)|since|yesterday|today)\b", cleaned, re.IGNORECASE):
            missing_info.append("Duration or recurrence timeline of the issue")
        if len(cleaned) < 30:
            missing_info.append("Detailed description of the severity or physical extent")

        # Concise summary
        summary = f"{reported_issue}. Impact: {impact_str}. Landmarks noted: {loc_str}."

        return {
            "summary": summary,
            "reported_issue": reported_issue,
            "location_clues": loc_str,
            "impact_assessment": impact_str,
            "missing_information": missing_info
        }

summarizer_service = AIComplaintSummarizer()
