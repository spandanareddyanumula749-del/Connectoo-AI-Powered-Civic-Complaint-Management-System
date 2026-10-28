import re
from typing import Dict, Any, Tuple

# Common vocabulary maps for Telugu and Hindi civic terms
TELUGU_MAP = {
    "గుంత": "pothole",
    "రోడ్డు": "road",
    "చెత్త": "garbage",
    "మురుగు": "sewage",
    "నీరు": "water",
    "నీటి": "water",
    "పైపు": "pipe",
    "లైటు": "light",
    "వీధి": "street",
    "కాలువ": "drain",
    "వాసన": "foul smell",
    "ప్రమాదం": "danger/accident",
    "సమస్య": "problem",
    "చీకటి": "darkness",
    "పాదచారుల": "pedestrian",
    "పార్కు": "park"
}

HINDI_MAP = {
    "गड्ढा": "pothole",
    "सड़क": "road",
    "कचरा": "garbage",
    "कूड़ा": "trash",
    "नाली": "drain",
    "सीवर": "sewer",
    "पानी": "water",
    "पाइप": "pipe",
    "बत्ती": "light",
    "स्ट्रीटलाइट": "streetlight",
    "अंधेरा": "darkness",
    "बदबू": "foul smell",
    "खतरा": "hazard/danger",
    "फुटपाथ": "footpath",
    "पार्क": "park",
    "जाम": "traffic jam"
}

class AIMultilingualService:
    def detect_language(self, text: str) -> str:
        """
        Detects if text contains Telugu, Devanagari (Hindi), or English/Latin characters.
        """
        # Telugu unicode range: \u0c00-\u0c7f
        if re.search(r"[\u0C00-\u0C7F]", text):
            return "te"
        # Devanagari unicode range: \u0900-\u097f
        elif re.search(r"[\u0900-\u097F]", text):
            return "hi"
        return "en"

    def translate_to_english(self, text: str, source_lang: str) -> Dict[str, Any]:
        """
        Provides translation into English for administrative staff while preserving original text.
        """
        if source_lang == "en" or not text.strip():
            return {
                "source_language": "en",
                "translated_text": text,
                "is_translated": False
            }

        translated_words = []
        words = re.findall(r"[\w\u0C00-\u0C7F\u0900-\u097F]+|[^\w\s]", text, re.UNICODE)

        lang_name = "Telugu" if source_lang == "te" else "Hindi"
        map_dict = TELUGU_MAP if source_lang == "te" else HINDI_MAP

        translations_found = []
        for w in words:
            if w in map_dict:
                translated_words.append(map_dict[w])
                translations_found.append(f"{w} -> {map_dict[w]}")
            else:
                translated_words.append(w)

        draft = " ".join(translated_words)
        
        summary_translation = f"[Translated from {lang_name}]: {draft}"
        if not translations_found:
            summary_translation = f"[Civic report recorded in {lang_name}]: {text}"

        return {
            "source_language": source_lang,
            "translated_text": summary_translation,
            "is_translated": True,
            "detected_civic_terms": translations_found
        }

multilingual_service = AIMultilingualService()
