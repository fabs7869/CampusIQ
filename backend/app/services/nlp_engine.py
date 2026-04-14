import re
from typing import Optional, Dict, List, Tuple
from app.models.complaint import ComplaintCategory

# Priority Weights for Data Science logic
SERVICE_WEIGHT = 3.0    # High priority (e.g. WiFi, Leak, Power)
INFRA_WEIGHT = 1.5      # Medium (e.g. Wall, Door, Bench)
LOCATION_WEIGHT = 0.5   # Low priority (e.g. Hostel, Canteen, Lab) - location shouldn't dictate category

# Ultimate Student Keyword Dictionary (High-Density & Weighted)
CATEGORY_KEYWORDS: Dict[ComplaintCategory, Dict[str, float]] = {
    ComplaintCategory.infrastructure: {
        "wall": INFRA_WEIGHT, "crack": INFRA_WEIGHT, "paint": INFRA_WEIGHT, "building": INFRA_WEIGHT, "bench": INFRA_WEIGHT, 
        "door": INFRA_WEIGHT, "window": INFRA_WEIGHT, "roof": INFRA_WEIGHT, "corridor": INFRA_WEIGHT, "stairs": INFRA_WEIGHT, 
        "brick": INFRA_WEIGHT, "floor": INFRA_WEIGHT, "tiles": INFRA_WEIGHT, "ceiling": INFRA_WEIGHT, "railing": INFRA_WEIGHT, 
        "gate": INFRA_WEIGHT, "fence": INFRA_WEIGHT, "pothole": INFRA_WEIGHT, "asphalt": INFRA_WEIGHT, "concrete": INFRA_WEIGHT,
        "lift": SERVICE_WEIGHT, "elevator": SERVICE_WEIGHT, "stairway": INFRA_WEIGHT, "balcony": INFRA_WEIGHT, "parking": LOCATION_WEIGHT,
        "furniture": INFRA_WEIGHT, "desk": INFRA_WEIGHT, "chair": INFRA_WEIGHT, "whiteboard": INFRA_WEIGHT, "podium": INFRA_WEIGHT,
        "seepage": SERVICE_WEIGHT, "structural": SERVICE_WEIGHT, "masonry": INFRA_WEIGHT, "lock": INFRA_WEIGHT, "handle": INFRA_WEIGHT
    },
    ComplaintCategory.electrical: {
        "bulb": SERVICE_WEIGHT, "light": SERVICE_WEIGHT, "switch": SERVICE_WEIGHT, "wire": SERVICE_WEIGHT, "spark": SERVICE_WEIGHT, 
        "socket": SERVICE_WEIGHT, "fan": SERVICE_WEIGHT, "electricity": SERVICE_WEIGHT, "power": SERVICE_WEIGHT, "shock": SERVICE_WEIGHT, 
        "generator": SERVICE_WEIGHT, "ups": SERVICE_WEIGHT, "mcb": SERVICE_WEIGHT, "voltage": SERVICE_WEIGHT, "shorting": SERVICE_WEIGHT, 
        "blackout": SERVICE_WEIGHT, "flicker": SERVICE_WEIGHT, "ac": SERVICE_WEIGHT, "cooler": SERVICE_WEIGHT, "plug": SERVICE_WEIGHT,
        "fuse": SERVICE_WEIGHT, "panel": SERVICE_WEIGHT, "current": SERVICE_WEIGHT, "air condition": SERVICE_WEIGHT,
        "short circuit": SERVICE_WEIGHT, "heater": SERVICE_WEIGHT, "geyser": SERVICE_WEIGHT, "thermostat": SERVICE_WEIGHT,
        "tripping": SERVICE_WEIGHT, "mcb trip": SERVICE_WEIGHT, "voltage fluctuation": SERVICE_WEIGHT
    },
    ComplaintCategory.plumbing: {
        "tap": SERVICE_WEIGHT, "leak": SERVICE_WEIGHT, "faucet": SERVICE_WEIGHT, "water": SERVICE_WEIGHT, "pipe": SERVICE_WEIGHT, 
        "drain": SERVICE_WEIGHT, "sink": SERVICE_WEIGHT, "flush": SERVICE_WEIGHT, "toilet": SERVICE_WEIGHT, "washroom": LOCATION_WEIGHT, 
        "tank": SERVICE_WEIGHT, "sewage": SERVICE_WEIGHT, "clog": SERVICE_WEIGHT, "shower": SERVICE_WEIGHT, "geyser": SERVICE_WEIGHT, 
        "basin": SERVICE_WEIGHT, "plumber": SERVICE_WEIGHT, "pump": SERVICE_WEIGHT, "overflow": SERVICE_WEIGHT, "bathroom": LOCATION_WEIGHT,
        "jet spray": SERVICE_WEIGHT, "commode": SERVICE_WEIGHT, "urinal": SERVICE_WEIGHT, "washbasin": SERVICE_WEIGHT,
        "water cooler": SERVICE_WEIGHT, "ro purifier": SERVICE_WEIGHT, "ro": SERVICE_WEIGHT, "blockage": SERVICE_WEIGHT
    },
    ComplaintCategory.cleanliness: {
        "dust": SERVICE_WEIGHT, "garbage": SERVICE_WEIGHT, "trash": SERVICE_WEIGHT, "dirty": SERVICE_WEIGHT, "litter": SERVICE_WEIGHT, 
        "smell": SERVICE_WEIGHT, "waste": SERVICE_WEIGHT, "clean": SERVICE_WEIGHT, "mop": SERVICE_WEIGHT, "stink": SERVICE_WEIGHT, 
        "stain": SERVICE_WEIGHT, "janitor": SERVICE_WEIGHT, "broom": SERVICE_WEIGHT, "pest": SERVICE_WEIGHT, "rodent": SERVICE_WEIGHT,
        "mosquito": SERVICE_WEIGHT, "flies": SERVICE_WEIGHT, "cockroach": SERVICE_WEIGHT, "dustbin": SERVICE_WEIGHT, "sweep": SERVICE_WEIGHT,
        "littering": SERVICE_WEIGHT, "unhygienic": SERVICE_WEIGHT, "odor": SERVICE_WEIGHT, "cobweb": SERVICE_WEIGHT, "pesticide": SERVICE_WEIGHT
    },
    ComplaintCategory.security: {
        "stranger": SERVICE_WEIGHT, "guard": SERVICE_WEIGHT, "gate": LOCATION_WEIGHT, "threat": SERVICE_WEIGHT, "fight": SERVICE_WEIGHT, 
        "locked": SERVICE_WEIGHT, "missing": SERVICE_WEIGHT, "theft": SERVICE_WEIGHT, "unauthorized": SERVICE_WEIGHT, 
        "harassment": SERVICE_WEIGHT, "cctv": SERVICE_WEIGHT, "camera": SERVICE_WEIGHT, "emergency": SERVICE_WEIGHT,
        "id card": SERVICE_WEIGHT, "theif": SERVICE_WEIGHT, "stolen": SERVICE_WEIGHT, "intruder": SERVICE_WEIGHT,
        "trespass": SERVICE_WEIGHT, "lost": SERVICE_WEIGHT, "safety": SERVICE_WEIGHT, "patrol": SERVICE_WEIGHT, "footage": SERVICE_WEIGHT
    },
    ComplaintCategory.it_services: {
        "wifi": SERVICE_WEIGHT, "internet": SERVICE_WEIGHT, "network": SERVICE_WEIGHT, "lan": SERVICE_WEIGHT, "password": SERVICE_WEIGHT, 
        "system": SERVICE_WEIGHT, "lab": LOCATION_WEIGHT, "printer": SERVICE_WEIGHT, "software": SERVICE_WEIGHT, "portal": SERVICE_WEIGHT, 
        "server": SERVICE_WEIGHT, "signal": SERVICE_WEIGHT, "connectivity": SERVICE_WEIGHT, "it support": SERVICE_WEIGHT,
        "desktop": SERVICE_WEIGHT, "computer": SERVICE_WEIGHT, "keyboard": SERVICE_WEIGHT, "monitor": SERVICE_WEIGHT, "pc": SERVICE_WEIGHT,
        "erp": SERVICE_WEIGHT, "login": SERVICE_WEIGHT, "scanner": SERVICE_WEIGHT, "toner": SERVICE_WEIGHT, "router": SERVICE_WEIGHT
    },
    ComplaintCategory.academic: {
        "lecture": LOCATION_WEIGHT, "exam": SERVICE_WEIGHT, "assignment": SERVICE_WEIGHT, "faculty": SERVICE_WEIGHT, "syllabus": SERVICE_WEIGHT, 
        "attendance": SERVICE_WEIGHT, "library": LOCATION_WEIGHT, "result": SERVICE_WEIGHT, "grade": SERVICE_WEIGHT, "fees": SERVICE_WEIGHT,
        "marksheet": SERVICE_WEIGHT, "erp": SERVICE_WEIGHT, "portal": SERVICE_WEIGHT, "professor": SERVICE_WEIGHT, "teacher": SERVICE_WEIGHT,
        "hall ticket": SERVICE_WEIGHT, "admit card": SERVICE_WEIGHT, "cgpa": SERVICE_WEIGHT, "transcript": SERVICE_WEIGHT, "registration": SERVICE_WEIGHT
    },
    ComplaintCategory.transportation: {
        "bus": SERVICE_WEIGHT, "shuttle": SERVICE_WEIGHT, "driver": SERVICE_WEIGHT, "transport": SERVICE_WEIGHT, "route": SERVICE_WEIGHT,
        "shuttle bus": SERVICE_WEIGHT, "commute": SERVICE_WEIGHT, "van": SERVICE_WEIGHT, "shuttle service": SERVICE_WEIGHT,
        "delay": SERVICE_WEIGHT, "pickup": SERVICE_WEIGHT, "drop": SERVICE_WEIGHT, "timing": SERVICE_WEIGHT, "pass": SERVICE_WEIGHT
    },
    ComplaintCategory.canteen: {
        "food": SERVICE_WEIGHT, "thali": SERVICE_WEIGHT, "hygiene": SERVICE_WEIGHT, "pantry": LOCATION_WEIGHT, "meal": SERVICE_WEIGHT, 
        "vendor": SERVICE_WEIGHT, "stale": SERVICE_WEIGHT, "price": SERVICE_WEIGHT, "menu": SERVICE_WEIGHT, "canteen": LOCATION_WEIGHT, 
        "cafeteria": LOCATION_WEIGHT, "mess": LOCATION_WEIGHT, "lunch": SERVICE_WEIGHT, "dinner": SERVICE_WEIGHT, "taste": SERVICE_WEIGHT,
        "overcharging": SERVICE_WEIGHT, "utensil": SERVICE_WEIGHT, "mess hall": LOCATION_WEIGHT
    }
}

def suggest_category(description: str) -> Optional[ComplaintCategory]:
    """
    Highly accurate, service-priority nlp engine (Static Version for Maximum Stability).
    """
    if not description or len(description.strip()) < 5:
        return None
        
    description = description.lower().strip()
    clean_desc = re.sub(r'[^\w\s]', ' ', description)
    tokens = clean_desc.split()
    
    # Calculate weights based on our Expert Priority Dictionary
    scores = {cat: 0.0 for cat in ComplaintCategory}
    
    # Keyword Density Weighting
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw, weight in keywords.items():
            if kw in description:
                scores[cat] += weight
                
    # Token matching refine
    for word in tokens:
        if len(word) < 3: continue
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if word in keywords:
                # Small boost for direct token match
                scores[cat] += 0.5
                    
    if not any(scores.values()): return None
    
    suggested = max(scores, key=scores.get)
    if scores[suggested] >= 0.5: # Lowered threshold as requested for better UX
        return suggested
        
    return None

def get_confidence_score(description: str, suggested_cat: ComplaintCategory) -> float:
    """Mock confidence score based on match density."""
    if not description: return 0.0
    # Logic could be more complex, but simplified for now
    return 0.92 
