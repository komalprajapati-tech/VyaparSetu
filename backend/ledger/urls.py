from django.urls import path
from .views import (
    entry_list_create,
    entry_detail,
    udhaar_list_create,
    udhaar_detail,
    ledger_summary,
    export_report,
    product_list_create,
    product_detail,
    billing_generate,
    billing_history,
    restaurant_dashboard_summary
)

urlpatterns = [
    path("entries/", entry_list_create),
    path("entries/<str:entry_id>/", entry_detail),
    path("udhaar/", udhaar_list_create),
    path("udhaar/<str:udhaar_id>/", udhaar_detail),
    path("ledger/summary/", ledger_summary),
    path("reports/export/", export_report),
    path("products/", product_list_create),
    path("products/<str:product_id>/", product_detail),
    path("billing/generate/", billing_generate),
    path("billing/history/", billing_history),
    path("restaurant/summary/", restaurant_dashboard_summary),
]

