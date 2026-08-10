from mongoengine import connect
from django.conf import settings

def get_uri_for_db(base_uri: str, target_db: str) -> str:
    if not base_uri:
        return base_uri
    if "?" in base_uri:
        prefix, query = base_uri.split("?", 1)
        base_path = prefix.rsplit("/", 1)[0]
        return f"{base_path}/{target_db}?{query}"
    else:
        base_path = base_uri.rsplit("/", 1)[0]
        return f"{base_path}/{target_db}"

def initialize_db():
    if settings.MONGO_URI:
        base_uri = settings.MONGO_URI
        
        retailer_uri = base_uri
        food_uri = get_uri_for_db(base_uri, "vyaparsetu_food")
        service_uri = get_uri_for_db(base_uri, "vyaparsetu_service")

        # 1. Retailer & Default database connection
        connect(host=retailer_uri, alias="default")
        connect(host=retailer_uri, alias="retailer")

        # 2. Food Business database connection
        connect(host=food_uri, alias="food")

        # 3. Service Business database connection
        connect(host=service_uri, alias="service")

        print("[OK] MongoDB Connected Successfully (retailer: billnova_db, food: vyaparsetu_food, service: vyaparsetu_service)")