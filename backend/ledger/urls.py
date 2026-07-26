from django.urls import path
from .views import (
    entry_list_create,
    entry_detail,
    udhaar_list_create,
    udhaar_detail,
    ledger_summary,
    export_report
)

urlpatterns = [
    path("entries/", entry_list_create),
    path("entries/<str:entry_id>/", entry_detail),
    path("udhaar/", udhaar_list_create),
    path("udhaar/<str:udhaar_id>/", udhaar_detail),
    path("ledger/summary/", ledger_summary),
    path("reports/export/", export_report),
]
