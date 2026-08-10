from mongoengine import Document, StringField, FloatField, DateTimeField, BooleanField, ListField, DictField
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

class Product(Document):
    user_email = StringField(required=True)
    name = StringField(required=True)
    category = StringField(required=True, default="General")
    price = FloatField(required=True)
    is_veg = BooleanField(default=True)
    is_available = BooleanField(default=True)
    variants = ListField(DictField(), default=list)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "products",
        "indexes": [
            "user_email",
            "category",
            "is_available"
        ]
    }

class Bill(Document):
    user_email = StringField(required=True)
    bill_number = StringField(required=True)
    items = ListField(DictField(), required=True)
    subtotal = FloatField(required=True)
    discount = FloatField(default=0.0)
    grand_total = FloatField(required=True)
    entry_id = StringField(null=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "bills",
        "indexes": [
            "user_email",
            "created_at"
        ]
    }

