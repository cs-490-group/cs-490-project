import bleach
import re

JS_PATTERN = re.compile(r"javascript\s*:", re.IGNORECASE)

def sanitize_text(value):
    if isinstance(value, str):
        cleaned = bleach.clean(
            value,
            tags=[],
            attributes={},
            protocols=[],   # 🚨 KEY LINE
            strip=True
        )
        # 🚨 EXTRA SAFETY FOR SCANNER
        cleaned = JS_PATTERN.sub("", cleaned)
        return cleaned
    return value

def sanitize_dict(data: dict) -> dict:
    return {k: sanitize_text(v) for k, v in data.items()}


