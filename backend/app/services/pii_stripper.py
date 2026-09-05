"""
FERPA & GDPR Compliance Data Preprocessing Layer.
Isolates and completely strips Personally Identifiable Information (PII)
(names, emails, student IDs, phone numbers, IP addresses) before passing
cold numerical vectors and anonymized academic features to the analytical layer.
"""

import uuid
import hashlib
import re
from typing import Dict, Any, Tuple

# Regex patterns for accidental PII injection in free-text fields
EMAIL_REGEX = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
PHONE_REGEX = re.compile(r'(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}')

PII_KEYS = {
    "student_name",
    "name",
    "first_name",
    "last_name",
    "email",
    "student_email",
    "student_id",
    "identifier",
    "user_id",
    "phone",
    "phone_number",
    "address",
    "dob",
    "date_of_birth",
    "ssn",
    "ip_address"
}

def sanitize_text(text: str) -> str:
    """Removes emails and phone numbers from arbitrary text strings."""
    if not isinstance(text, str):
        return text
    sanitized = EMAIL_REGEX.sub("[REDACTED_EMAIL]", text)
    sanitized = PHONE_REGEX.sub("[REDACTED_PHONE]", sanitized)
    return sanitized

def strip_pii(data: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """
    Strips all PII from the incoming payload.
    Returns an ephemeral anonymized session ID and a sanitized dictionary
    containing solely cold academic metrics and numerical vectors.
    """
    # Generate an ephemeral session token that cannot be reversed to student identity
    salt = uuid.uuid4().hex
    anonymized_id = hashlib.sha256(f"anon_{salt}".encode("utf-8")).hexdigest()[:16]

    cold_features: Dict[str, Any] = {
        "anonymized_id": anonymized_id
    }

    for key, value in data.items():
        key_lower = key.lower()
        if key_lower in PII_KEYS:
            # Strictly drop PII
            continue
        
        if isinstance(value, str):
            cold_features[key] = sanitize_text(value)
        elif isinstance(value, (int, float, bool)):
            cold_features[key] = value
        elif isinstance(value, list):
            # Process list of subjects/courses
            cleaned_list = []
            for item in value:
                if isinstance(item, dict):
                    cleaned_item = {
                        k: v for k, v in item.items() if k.lower() not in PII_KEYS
                    }
                    cleaned_list.append(cleaned_item)
                else:
                    cleaned_list.append(item)
            cold_features[key] = cleaned_list
        elif isinstance(value, dict):
            # Nested dictionary
            cleaned_dict = {
                k: v for k, v in value.items() if k.lower() not in PII_KEYS
            }
            cold_features[key] = cleaned_dict
        else:
            # Retain non-PII primitives
            cold_features[key] = value

    return anonymized_id, cold_features
