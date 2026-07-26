from mongoengine import (
    Document,
    StringField,
    EmailField,
    BooleanField,
    DateTimeField,
    ListField,
    IntField
)
from datetime import datetime


class User(Document):
    business_name = StringField(required=True, max_length=150)
    owner_full_name = StringField(required=True, max_length=100)
    email = EmailField(required=True, unique=True)

    password_hash = StringField(required=True)

    is_verified = BooleanField(default=False)

    business_type = StringField(default="")
    theme_color = StringField(default="forest_green")
    language = StringField(default="en")
    
    phone_number = StringField(default="")
    profile_pic = StringField(default="") # base64 string
    eod_reminder_time = StringField(default="22:00")
    eod_reminder_enabled = BooleanField(default=True)

    otp_request_timestamps = ListField(DateTimeField(), default=list)

    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "users",
        "strict": False
    }


class OTP(Document):
    email = EmailField(required=True, unique=True)
    otp_hash = StringField(required=True)
    attempts = IntField(default=0)
    created_at = DateTimeField(default=datetime.utcnow)
    expires_at = DateTimeField(required=True)

    meta = {
        "collection": "otps",
        "indexes": [
            {
                "fields": ["expires_at"],
                "expireAfterSeconds": 0
            }
        ]
    }


class ResetOTP(Document):
    email = EmailField(required=True, unique=True)
    otp_hash = StringField(required=True)
    attempts = IntField(default=0)
    created_at = DateTimeField(default=datetime.utcnow)
    expires_at = DateTimeField(required=True)

    meta = {
        "collection": "reset_otps",
        "indexes": [
            {
                "fields": ["expires_at"],
                "expireAfterSeconds": 0
            }
        ]
    }


class Notification(Document):
    user_email = StringField(required=True)
    title = StringField(required=True)
    message = StringField(required=True)
    type = StringField(required=True) # inactivity, udhaar_overdue, loss_alert, summary, eod_reminder
    is_read = BooleanField(default=False)
    is_dismissed = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "notifications",
        "indexes": [
            "user_email",
            "is_dismissed"
        ]
    }