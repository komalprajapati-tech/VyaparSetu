import re


def validate_register(data):
    required_fields = [
        "businessName",
        "ownerFullName",
        "email",
        "password",
        "confirmPassword",
        "agreeToTerms",
    ]

    for field in required_fields:
        if field not in data or data.get(field) in [None, ""]:
            return False, f"{field} is required."

    email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    if not re.match(email_pattern, data["email"]):
        return False, "Invalid email address."

    if len(data["password"]) < 8:
        return False, "Password must be at least 8 characters."

    if data["password"] != data["confirmPassword"]:
        return False, "Passwords do not match."

    if data["agreeToTerms"] is not True:
        return False, "You must accept the Terms & Conditions."

    return True, None