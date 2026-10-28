import re
from typing import Dict, Any, List
from app.models.models import ComplaintPriority

# Signal words indicating critical public danger or immediate health crisis
CRITICAL_SIGNALS = [
    r"\b(electrocution|live wire|short circuit|sparking|fire|explosion)\b",
    r"\b(open manhole|drowning|deep crater|fatal|severe accident|injury|blood)\b",
    r"\b(toxic|chemical leak|gas leak|asphyxiation|hospital|emergency)\b",
    r"\b(collapsed|cave in|bridge collapse|wall falling)\b"
]

# Signal words indicating high urgency / public hazard
HIGH_SIGNALS = [
    r"\b(burst pipe|drinking water flooding|major leak|gushing water)\b",
    r"\b(overflowing sewage|black water|stinking sewer|foul smell|contamination|disease|dengue|malaria)\b",
    r"\b(traffic gridlock|junction jammed|signal stuck|school zone|hospital road)\b",
    r"\b(pitch dark|complete blackout|unsafe for women|night accident)\b",
    r"\b(blocked road|ambulance cannot pass|highway crater)\b"
]

# Signal words indicating medium priority
MEDIUM_SIGNALS = [
    r"\b(pothole|bumpy road|garbage heap|rotting waste|trash|litter)\b",
    r"\b(low pressure|water shortage|broken tile|pavement cracked)\b",
    r"\b(streetlight not working|dim light|fused bulb)\b",
    r"\b(illegal dumping|construction debris)\b"
]

# Base severity multiplier per category
CATEGORY_SEVERITY_BIAS = {
    "Potholes and damaged roads": 0.15,
    "Drainage and sewage problems": 0.20,
    "Water leakage and water supply": 0.15,
    "Traffic signals and road safety": 0.25,
    "Broken streetlights": 0.10,
    "Garbage accumulation": 0.10,
    "Public park maintenance": -0.10,
    "Damaged footpaths": 0.05,
    "Illegal dumping": 0.10,
    "Other civic issues": 0.0
}

class AISeverityEngine:
    def evaluate(self, title: str, description: str, category_name: str = "") -> Dict[str, Any]:
        combined_text = f"{title} {description}".lower()
        risk_factors = []
        score = 0.40  # baseline medium

        # Check critical signals
        critical_matches = []
        for pat in CRITICAL_SIGNALS:
            m = re.findall(pat, combined_text)
            if m:
                critical_matches.extend(m)
        if critical_matches:
            matched_terms = list(set([term if isinstance(term, str) else term[0] for term in critical_matches]))
            risk_factors.append(f"Immediate hazard triggers detected: {', '.join(matched_terms[:3])}")
            score += 0.45

        # Check high signals
        high_matches = []
        for pat in HIGH_SIGNALS:
            m = re.findall(pat, combined_text)
            if m:
                high_matches.extend(m)
        if high_matches:
            matched_terms = list(set([term if isinstance(term, str) else term[0] for term in high_matches]))
            risk_factors.append(f"Urgent impact indicators found: {', '.join(matched_terms[:3])}")
            score += 0.25

        # Check medium signals
        for pat in MEDIUM_SIGNALS:
            m = re.findall(pat, combined_text)
            if m:
                score += 0.05
                break

        # Category bias
        bias = CATEGORY_SEVERITY_BIAS.get(category_name, 0.0)
        score += bias

        # Keyword amplification for duration and vulnerability
        if re.search(r"\b(\d+\s*(days|weeks|months)|long time|prolonged|repeated)\b", combined_text):
            risk_factors.append("Extended duration of issue reported by citizen")
            score += 0.10
        if re.search(r"\b(children|school|elderly|hospital|clinic|patient|disabled)\b", combined_text):
            risk_factors.append("Affects vulnerable population (school / hospital / elderly)")
            score += 0.15

        # Bound score between 0.1 and 1.0
        score = min(0.99, max(0.15, score))

        if score >= 0.78:
            priority = ComplaintPriority.CRITICAL
            reasoning = "High risk to public health or life safety identified based on emergency triggers and location vulnerability."
        elif score >= 0.55:
            priority = ComplaintPriority.HIGH
            reasoning = "Elevated risk affecting urban mobility, potable water supply, or sanitation requiring prompt intervention."
        elif score >= 0.32:
            priority = ComplaintPriority.MEDIUM
            reasoning = "Standard civic inconvenience with localized impact; schedule under standard department SLA."
        else:
            priority = ComplaintPriority.LOW
            reasoning = "Minor cosmetic or non-hazardous maintenance matter suitable for routine maintenance schedules."

        if not risk_factors:
            risk_factors.append("Standard localized infrastructure impact")

        confidence = round(0.70 + (score * 0.25), 2)

        return {
            "severity": priority,
            "confidence": confidence,
            "reasoning": reasoning,
            "risk_factors": risk_factors
        }

severity_service = AISeverityEngine()
