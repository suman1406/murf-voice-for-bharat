import re


def sanitize_summary(text: str) -> str:
    """
    Scrubs sensitive private information (PII) such as passwords, OTPs, PINs,
    credit/debit card numbers, and bank account numbers from escalation summaries.
    """
    if not text:
        return text

    # Redact 4-6 digit OTPs or PINs (e.g., OTP 123456, pin: 4321)
    text = re.sub(r"\b(otp|pin|passcode|password)\b\s*[:=-]?\s*\d{4,8}\b", r"\1 [REDACTED]", text, flags=re.IGNORECASE)

    # Redact 12-16 digit account or card numbers
    text = re.sub(r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", "[ACCOUNT/CARD REDACTED]", text)
    text = re.sub(r"\b(account|acct|card|bank|aahaar|aadhaar)\s*(number|no|#)?\s*[:=-]?\s*\d{6,16}\b", r"\1 [REDACTED]", text, flags=re.IGNORECASE)

    # Redact explicit passwords
    text = re.sub(r"\b(password|pwd|pass)\s*[:=]\s*\S+", r"\1 [REDACTED]", text, flags=re.IGNORECASE)

    return text.strip()
