from django.apps import AppConfig
from django.conf import settings
from mongoengine import connect


class AuthenticationConfig(AppConfig):
    name = 'authentication'

    def ready(self):
        if settings.MONGO_URI:
            connect(host=settings.MONGO_URI)
