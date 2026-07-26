from django.urls import path
from .views import (
    register, 
    verify_otp, 
    resend_otp_view, 
    login, 
    forgot_password, 
    reset_password, 
    user_profile, 
    refresh_token_view,
    notifications_list,
    mark_notification_read,
    mark_notification_dismissed
)

urlpatterns = [
    path("register/", register),
    path("verify-otp/", verify_otp),
    path("resend-otp/", resend_otp_view),
    path("login/", login),
    path("forgot-password/", forgot_password),
    path("reset-password/", reset_password),
    path("profile/", user_profile),
    path("refresh/", refresh_token_view),
    path("notifications/", notifications_list),
    path("notifications/<str:notif_id>/read/", mark_notification_read),
    path("notifications/<str:notif_id>/dismiss/", mark_notification_dismissed),
]