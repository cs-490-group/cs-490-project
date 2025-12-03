# backend/services/job_requirements_extractor.py

"""
Tools for extracting job requirements from raw job descriptions.

Extracts:
- requiredSkills      → [{ name, level, weight }]
- minYearsExperience  → float
- educationLevel      → str
"""

import re
from typing import List, Dict, Any


# ============================================================
# 1. SKILL DICTIONARY (expandable)
# ============================================================

SKILL_KEYWORDS = {
    "python": ["python"],
    "java": ["java"],
    "c++": ["c++", "cpp"],
    "javascript": ["javascript", "js", "node", "node.js"],
    "react": ["react", "react.js", "reactjs"],
    "sql": ["sql", "postgres", "mysql", "mongodb"],
    "html": ["html"],
    "css": ["css"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "git": ["git"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "machine learning": ["machine learning", "ml", "deep learning"],
    "data analysis": ["data analysis", "analytics"],
    "communication": ["communication", "written communication", "verbal communication"]
}


def extract_skills(text: str) -> List[Dict[str, Any]]:
    """
    Returns a list of:
    [
      { name: "Python", level: 1, weight: 1.0 },
      ...
    ]
    """

    if not text:
        return []

    text_lower = text.lower()
    found = []

    for canonical, keywords in SKILL_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                found.append({
                    "name": canonical,
                    "level": 1,      # simple model: level unknown → assume basic
                    "weight": 1.0    # future: weight based on frequency
                })
                break

    return found


# ============================================================
# 2. EXPERIENCE EXTRACTION
# ============================================================

EXPERIENCE_REGEXES = [
    r"(\d+)\+?\s+years?",
    r"(\d+)\s+yrs?",
    r"minimum of\s+(\d+)\s+years",
    r"at least\s+(\d+)\s+years?",
    r"(\d+)-(\d+)\s+years?"
]


def extract_years_experience(text: str) -> float | None:
    """
    Extracts minimum years of experience from text.
    Returns float or None.
    """
    if not text:
        return None

    text_lower = text.lower()

    for pattern in EXPERIENCE_REGEXES:
        match = re.search(pattern, text_lower)
        if match:
            if len(match.groups()) == 2:
                # Range like "3-5 years"
                return float(match.group(1))
            return float(match.group(1))

    return None


# ============================================================
# 3. EDUCATION EXTRACTION
# ============================================================

EDUCATION_KEYWORDS = {
    "highschool": ["high school diploma", "hs diploma"],
    "associate": ["associate", "aas", "as degree"],
    "bachelor": ["bachelor", "bs degree", "ba degree", "undergraduate"],
    "master": ["master", "ms degree", "graduate degree"],
    "phd": ["phd", "doctorate"]
}


def extract_education_level(text: str) -> str | None:
    """
    Returns normalized education level:
    - "highschool"
    - "associate"
    - "bachelor"
    - "master"
    - "phd"
    """

    if not text:
        return None

    text_lower = text.lower()

    for level, keywords in EDUCATION_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                return level

    return None


# ============================================================
# 4. MAIN EXTRACTION WRAPPER (optional – nice for debugging)
# ============================================================

def extract_job_requirements(description: str) -> Dict[str, Any]:
    """
    Performs full extraction:
    {
        "requiredSkills": [...],
        "minYearsExperience": float | None,
        "educationLevel": str | None
    }
    """
    return {
        "requiredSkills": extract_skills(description),
        "minYearsExperience": extract_years_experience(description),
        "educationLevel": extract_education_level(description)
    }





