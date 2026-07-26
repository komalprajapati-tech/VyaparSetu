from mongoengine import Document, StringField, FloatField, DateTimeField
from datetime import datetime

class Entry(Document):
    user_email = StringField(required=True)
    amount = FloatField(required=True)
    type = StringField(required=True, choices=["income", "expense"])
    category = StringField(required=True)
    date = DateTimeField(required=True)
    note = StringField(null=True)
    receipt_img = StringField(null=True)  # Base64 text or empty
    business_type = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "entries",
        "indexes": [
            "user_email",
            "date",
            "type"
        ]
    }

class Udhaar(Document):
    user_email = StringField(required=True)
    customer_name = StringField(required=True)
    amount = FloatField(required=True)
    due_date = DateTimeField(null=True)
    status = StringField(default="pending", choices=["pending", "paid"])
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "udhaar",
        "indexes": [
            "user_email",
            "status"
        ]
    }
