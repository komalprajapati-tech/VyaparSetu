from mongoengine import connect
from django.conf import settings

def initialize_db():
    if settings.MONGO_URI:
        connect(host=settings.MONGO_URI)
        print("[OK] MongoDB Connected Successfully")