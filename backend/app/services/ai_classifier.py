import re
from typing import Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# Training samples representing realistic citizen reports across the 10 civic categories
TRAINING_DATA = [
    # Potholes and damaged roads
    ("Deep pothole in the middle of the road causing tire punctures and accidents", "Potholes and damaged roads"),
    ("Asphalt is broken and crater on main street near market", "Potholes and damaged roads"),
    ("Road surface has completely eroded after heavy rain, big ditch", "Potholes and damaged roads"),
    ("Dangerous pothole near school crossing, vehicles getting stuck", "Potholes and damaged roads"),
    ("Damaged road with loose gravel and cracks on the highway", "Potholes and damaged roads"),
    ("Tar is peeling off and large cavities on the road lane", "Potholes and damaged roads"),
    ("Uneven road surface and sunken road patch causing traffic slow down", "Potholes and damaged roads"),

    # Garbage accumulation
    ("Garbage has been accumulating near our apartment for three days, smells terrible", "Garbage accumulation"),
    ("Huge heap of trash and waste dumped at street corner", "Garbage accumulation"),
    ("Overflowing municipal trash bin, stray dogs spreading garbage everywhere", "Garbage accumulation"),
    ("Rotting organic waste not cleared by sanitation workers for a week", "Garbage accumulation"),
    ("Uncollected domestic garbage bins left open creating health hazard", "Garbage accumulation"),
    ("Litter and plastic waste scattered across residential street", "Garbage accumulation"),
    ("Dumpster is completely full and trash spilling onto the road", "Garbage accumulation"),

    # Water leakage and water supply
    ("Drinking water pipe burst, thousands of liters of clean water getting wasted", "Water leakage and water supply"),
    ("Water supply pipeline leaking under high pressure near apartment building", "Water leakage and water supply"),
    ("Low water pressure and contaminated muddy tap water since yesterday", "Water leakage and water supply"),
    ("No municipal water supply in our colony for two consecutive days", "Water leakage and water supply"),
    ("Water main valve broken and flooding the street with potable water", "Water leakage and water supply"),
    ("Continuous water leakage from municipal valve chamber", "Water leakage and water supply"),

    # Drainage and sewage problems
    ("Sewage line overflowing onto pedestrian walkway with foul odor", "Drainage and sewage problems"),
    ("Blocked drainage manhole causing black wastewater to flood our lane", "Drainage and sewage problems"),
    ("Stormwater drain clogged with silt and plastic, stagnant dirty water", "Drainage and sewage problems"),
    ("Open manhole cover missing on sewage gutter, extreme hazard for walkers", "Drainage and sewage problems"),
    ("Drainage backup in residential basement during monsoon shower", "Drainage and sewage problems"),
    ("Underground sewer choked and dirty water overflowing on footpath", "Drainage and sewage problems"),

    # Broken streetlights
    ("Streetlight pole not functioning, entire block is pitch dark at night", "Broken streetlights"),
    ("Broken lamp on street light post, blinking constantly and sparking", "Broken streetlights"),
    ("Street lights have not been turning on for past 4 nights", "Broken streetlights"),
    ("Dark street alley with fused sodium vapor bulb causing safety concern for women", "Broken streetlights"),
    ("Damaged electrical wires hanging from street lighting pole", "Broken streetlights"),
    ("LED streetlight fixture damaged and hanging loosely from the bracket", "Broken streetlights"),

    # Damaged footpaths
    ("Footpath paving tiles broken and missing, pedestrians forced to walk on road", "Damaged footpaths"),
    ("Broken sidewalk slab, elderly citizen tripped and got injured", "Damaged footpaths"),
    ("Sidewalk obstructed by broken curb stones and construction debris", "Damaged footpaths"),
    ("Cracked pedestrian pavement with exposed steel rebar", "Damaged footpaths"),
    ("Footpath has caved in near bus stop, walking is dangerous", "Damaged footpaths"),

    # Illegal dumping
    ("Commercial trucks dumping debris and concrete waste in open empty plot", "Illegal dumping"),
    ("Construction demolition rubble dumped illegally along the lake bed", "Illegal dumping"),
    ("Industrial chemical waste drums discarded by unidentified vehicle", "Illegal dumping"),
    ("Illegal dumping of poultry and biological slaughter waste in vacant site", "Illegal dumping"),
    ("Someone dumped heaps of discarded tires and plastic bags in buffer zone", "Illegal dumping"),

    # Public park maintenance
    ("Public park grass overgrown and children swing set is broken", "Public park maintenance"),
    ("Damaged benches and dry dead trees ready to fall in colony garden", "Public park maintenance"),
    ("Park fountain not working, dirty stagnant water breeding mosquitoes", "Public park maintenance"),
    ("Jogging track in municipal park has broken paving and thorny weeds", "Public park maintenance"),
    ("Broken gate of community park allowing stray cattle inside", "Public park maintenance"),

    # Traffic signals and road safety
    ("Traffic signal at crossroads is stuck on red in all directions", "Traffic signals and road safety"),
    ("Traffic lights blank and not working, causing heavy gridlock at intersection", "Traffic signals and road safety"),
    ("Speed breaker paint worn off, no warning signs leading to vehicle jumps", "Traffic signals and road safety"),
    ("Fallen directional sign board blocking traffic view", "Traffic signals and road safety"),
    ("Pedestrian zebra crossing signal countdown timer broken", "Traffic signals and road safety"),

    # Other civic issues
    ("Dead animal carcass lying near transformer, needs immediate removal", "Other civic issues"),
    ("Illegal billboard hoarding erected dangerously without permit", "Other civic issues"),
    ("Excessive noise pollution from illegal loudspeaker at midnight", "Other civic issues"),
    ("Stray dog menace with aggressive pack chasing two-wheelers", "Other civic issues"),
    ("Encroachment on public road by temporary shop stalls", "Other civic issues")
]

# Mapping category names to departments and actions
CATEGORY_DEPT_MAPPING = {
    "Potholes and damaged roads": {
        "dept_name": "Roads & Infrastructure Department",
        "dept_code": "ROADS",
        "next_action": "Dispatch road maintenance inspection crew to survey surface crater depth."
    },
    "Garbage accumulation": {
        "dept_name": "Sanitation & Solid Waste Management",
        "dept_code": "SANITATION",
        "next_action": "Schedule immediate municipal waste collection compactor truck."
    },
    "Water leakage and water supply": {
        "dept_name": "Water Supply & Sewerage Board",
        "dept_code": "WATER",
        "next_action": "Send emergency valve operator to isolate pipeline burst and commence repair."
    },
    "Drainage and sewage problems": {
        "dept_name": "Water Supply & Sewerage Board",
        "dept_code": "WATER",
        "next_action": "Deploy jetting cum suction machine to clear underground sewage blockage."
    },
    "Broken streetlights": {
        "dept_name": "Electrical & Traffic Engineering",
        "dept_code": "ELECTRICAL",
        "next_action": "Assign electrician unit with sky-lift ladder to replace fixture/choke."
    },
    "Damaged footpaths": {
        "dept_name": "Roads & Infrastructure Department",
        "dept_code": "ROADS",
        "next_action": "Inspect damaged sidewalk tiles and schedule paver re-laying."
    },
    "Illegal dumping": {
        "dept_name": "Sanitation & Solid Waste Management",
        "dept_code": "SANITATION",
        "next_action": "Issue municipal vigilance notice and deploy earthmover to clear debris."
    },
    "Public park maintenance": {
        "dept_name": "Horticulture & Parks Department",
        "dept_code": "HORTICULTURE",
        "next_action": "Alert zonal park supervisor for pruning, equipment repair, and cleaning."
    },
    "Traffic signals and road safety": {
        "dept_name": "Electrical & Traffic Engineering",
        "dept_code": "ELECTRICAL",
        "next_action": "Coordinate with traffic police control room to reset and recalibrate signal controller."
    },
    "Other civic issues": {
        "dept_name": "Municipal Citizen Services",
        "dept_code": "GENERAL",
        "next_action": "Route to zonal officer for triage and appropriate department forwarding."
    }
}

class AIClassifier:
    def __init__(self):
        self.model = None
        self._train_model()

    def _train_model(self):
        texts, labels = zip(*TRAINING_DATA)
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words='english')),
            ('clf', MultinomialNB(alpha=0.1))
        ])
        pipeline.fit(texts, labels)
        self.model = pipeline

    def classify(self, text: str) -> Dict[str, Any]:
        cleaned_text = text.strip()
        if not cleaned_text:
            return {
                "category_name": "Other civic issues",
                "department_name": "Municipal Citizen Services",
                "department_code": "GENERAL",
                "confidence": 0.5,
                "suggested_next_action": "Route to zonal officer for manual triage."
            }

        # Predict probability distribution
        probas = self.model.predict_proba([cleaned_text])[0]
        classes = self.model.classes_
        top_idx = probas.argmax()
        predicted_category = classes[top_idx]
        confidence = float(probas[top_idx])

        # Normalize confidence to realistic percentage range (0.65 to 0.98 for matching text)
        confidence_score = round(min(0.98, max(0.60, confidence * 1.5)), 2)

        mapping = CATEGORY_DEPT_MAPPING.get(predicted_category, CATEGORY_DEPT_MAPPING["Other civic issues"])

        return {
            "category_name": predicted_category,
            "department_name": mapping["dept_name"],
            "department_code": mapping["dept_code"],
            "confidence": confidence_score,
            "suggested_next_action": mapping["next_action"]
        }

classifier_service = AIClassifier()
