from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.contrib.auth.hashers import check_password, make_password
from django.conf import settings
import jwt

from .validators import validate_register
from .services import (
    email_exists, 
    create_user, 
    resend_otp_service, 
    verify_otp_hash,
    forgot_password_service
)
from .models import User, OTP, ResetOTP, Notification


@api_view(["POST"])
def register(request):
    try:
        data = request.data

        is_valid, error = validate_register(data)

        if not is_valid:
            return Response(
                {
                    "success": False,
                    "message": error
                },
                status=400
            )

        # Check if user already exists
        user = User.objects(email=data["email"]).first()
        if user:
            if user.is_verified:
                return Response(
                    {
                        "success": False,
                        "message": "Email already registered."
                    },
                    status=409
                )
            else:
                # If user is unverified, check their rate limit and resend OTP
                success, message = resend_otp_service(user.email)
                if not success:
                    if "Too many OTP requests" in message:
                        return Response(
                            {
                                "success": False,
                                "message": message
                            },
                            status=429
                        )
                    return Response(
                        {
                            "success": False,
                            "message": message
                        },
                        status=500
                    )
                return Response(
                    {
                        "success": True,
                        "message": "OTP sent to your email."
                    },
                    status=200
                )

        # Register new user
        user, email_sent, email_err = create_user(data)

        if not email_sent:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to send OTP email: {email_err}"
                },
                status=500
            )

        return Response(
            {
                "success": True,
                "message": "OTP sent to your email."
            },
            status=201
        )
    except Exception as e:
        print("Register Exception:", str(e))
        return Response(
            {
                "success": False,
                "message": f"Server Error: {str(e)}"
            },
            status=500
        )


@api_view(["POST"])
def verify_otp(request):
    data = request.data
    email = data.get("email")
    otp = data.get("otp")

    if not email or not otp:
        return Response(
            {
                "success": False,
                "message": "Email and OTP are required."
            },
            status=400
        )

    user = User.objects(email=email).first()
    if not user:
        return Response(
            {
                "success": False,
                "message": "User not found."
            },
            status=404
        )

    if user.is_verified:
        return Response(
            {
                "success": True,
                "message": "Email already verified."
            },
            status=200
        )

    # Fetch OTP document
    otp_doc = OTP.objects(email=email).first()
    if not otp_doc:
        return Response(
            {
                "success": False,
                "message": "Invalid or expired OTP. Please request a new one."
            },
            status=400
        )

    # Check OTP expiry (TTL index handles automatic deletion from DB, but we do safety check too)
    if otp_doc.expires_at.replace(tzinfo=None) < datetime.utcnow():
        otp_doc.delete()
        return Response(
            {
                "success": False,
                "message": "OTP has expired. Please request a new one."
            },
            status=400
        )

    # Verify code using bcrypt
    if not verify_otp_hash(otp, otp_doc.otp_hash):
        otp_doc.attempts += 1
        if otp_doc.attempts >= 3:
            otp_doc.delete()
            return Response(
                {
                    "success": False,
                    "message": "Invalid OTP. Max attempts reached. Please request a new OTP."
                },
                status=400
            )
        otp_doc.save()
        remaining = 3 - otp_doc.attempts
        return Response(
            {
                "success": False,
                "message": f"Invalid OTP. {remaining} attempt(s) remaining."
            },
            status=400
        )

    # Success: Delete OTP document and mark user as verified
    otp_doc.delete()
    user.is_verified = True
    user.save()

    # Generate token
    payload = {
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=1),
        "iat": datetime.utcnow(),
        "token_type": "access"
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    refresh_payload = {
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
        "token_type": "refresh"
    }
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET, algorithm="HS256")

    return Response(
        {
            "success": True,
            "message": "Email verified successfully.",
            "accessToken": token,
            "refreshToken": refresh_token,
            "user": {
                "email": user.email,
                "businessName": user.business_name,
                "ownerFullName": user.owner_full_name,
                "businessType": user.business_type,
                "themeColor": user.theme_color,
                "language": user.language,
                "phoneNumber": getattr(user, "phone_number", ""),
                "profilePic": getattr(user, "profile_pic", ""),
                "eodReminderTime": getattr(user, "eod_reminder_time", "22:00"),
                "eodReminderEnabled": getattr(user, "eod_reminder_enabled", True)
            }
        },
        status=200
    )


@api_view(["POST"])
def resend_otp_view(request):
    data = request.data
    email = data.get("email")

    if not email:
        return Response(
            {
                "success": False,
                "message": "Email is required."
            },
            status=400
        )

    success, message = resend_otp_service(email)
    if not success:
        if "Too many OTP requests" in message:
            return Response(
                {
                    "success": False,
                    "message": message
                },
                status=429
            )
        return Response(
            {
                "success": False,
                "message": message
            },
            status=500
        )

    return Response(
        {
            "success": True,
            "message": message
        },
        status=200
    )


@api_view(["POST"])
def login(request):
    data = request.data
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return Response(
            {
                "success": False,
                "message": "Email and password are required."
            },
            status=400
        )

    user = User.objects(email=email).first()
    if not user:
        return Response(
            {
                "success": False,
                "message": "Invalid email or password."
            },
            status=400
        )

    # Check password
    if not check_password(password, user.password_hash):
        return Response(
            {
                "success": False,
                "message": "Invalid email or password."
            },
            status=400
        )

    # Check if user is verified
    if not user.is_verified:
        return Response(
            {
                "success": False,
                "isVerified": False,
                "message": "Please verify your email first.",
                "email": email
            },
            status=403
        )

    # Generate token
    payload = {
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=1),
        "iat": datetime.utcnow(),
        "token_type": "access"
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    refresh_payload = {
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
        "token_type": "refresh"
    }
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET, algorithm="HS256")

    # Success: return user info
    return Response(
        {
            "success": True,
            "isVerified": True,
            "message": "Login successful.",
            "accessToken": token,
            "refreshToken": refresh_token,
            "user": {
                "email": user.email,
                "businessName": user.business_name,
                "ownerFullName": user.owner_full_name,
                "businessType": user.business_type,
                "themeColor": user.theme_color,
                "language": user.language,
                "phoneNumber": getattr(user, "phone_number", ""),
                "profilePic": getattr(user, "profile_pic", ""),
                "eodReminderTime": getattr(user, "eod_reminder_time", "22:00"),
                "eodReminderEnabled": getattr(user, "eod_reminder_enabled", True)
            }
        },
        status=200
    )


@api_view(["POST"])
def forgot_password(request):
    data = request.data
    email = data.get("email")

    if not email:
        return Response(
            {
                "success": False,
                "message": "Email is required."
            },
            status=400
        )

    success, message = forgot_password_service(email)
    if not success:
        if "Too many OTP requests" in message:
            return Response(
                {
                    "success": False,
                    "message": message
                },
                status=429
            )
        if "not registered" in message:
            return Response(
                {
                    "success": False,
                    "message": message
                },
                status=404
            )
        return Response(
            {
                "success": False,
                "message": message
            },
            status=500
        )

    return Response(
        {
            "success": True,
            "message": message
        },
        status=200
    )


@api_view(["POST"])
def reset_password(request):
    data = request.data
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("newPassword")

    if not email or not otp or not new_password:
        return Response(
            {
                "success": False,
                "message": "Email, OTP, and new password are required."
            },
            status=400
        )

    if len(new_password) < 8:
        return Response(
            {
                "success": False,
                "message": "Password must be at least 8 characters."
            },
            status=400
        )

    user = User.objects(email=email).first()
    if not user:
        return Response(
            {
                "success": False,
                "message": "User not found."
            },
            status=404
        )

    # Fetch Reset OTP document
    otp_doc = ResetOTP.objects(email=email).first()
    if not otp_doc:
        return Response(
            {
                "success": False,
                "message": "Invalid or expired reset code. Please request a new one."
            },
            status=400
        )

    # Check OTP expiry
    if otp_doc.expires_at.replace(tzinfo=None) < datetime.utcnow():
        otp_doc.delete()
        return Response(
            {
                "success": False,
                "message": "Reset code has expired. Please request a new one."
            },
            status=400
        )

    # Verify OTP code using bcrypt
    if not verify_otp_hash(otp, otp_doc.otp_hash):
        otp_doc.attempts += 1
        if otp_doc.attempts >= 3:
            otp_doc.delete()
            return Response(
                {
                    "success": False,
                    "message": "Invalid reset code. Max attempts reached. Please request a new code."
                },
                status=400
            )
        otp_doc.save()
        remaining = 3 - otp_doc.attempts
        return Response(
            {
                "success": False,
                "message": f"Invalid reset code. {remaining} attempt(s) remaining."
            },
            status=400
        )

    # Success: Delete Reset OTP, Hash new password, update User and save
    otp_doc.delete()
    user.password_hash = make_password(new_password)
    user.save()

    return Response(
        {
            "success": True,
            "message": "Password reset successful. Please log in with your new password."
        },
        status=200
    )


@api_view(["GET", "PUT"])
def user_profile(request):
    # Parse Auth Header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("token_type") != "access":
            return Response({"success": False, "message": "Invalid token. Access token required."}, status=401)
        user_email = payload.get("email")
    except Exception:
        return Response({"success": False, "message": "Invalid token or session expired."}, status=401)

    user = User.objects(email=user_email).first()
    if not user:
        return Response({"success": False, "message": "User not found."}, status=404)

    if request.method == "GET":
        return Response({
            "success": True,
            "user": {
                "email": user.email,
                "businessName": user.business_name,
                "ownerFullName": user.owner_full_name,
                "businessType": user.business_type,
                "themeColor": user.theme_color,
                "language": user.language,
                "phoneNumber": getattr(user, "phone_number", ""),
                "profilePic": getattr(user, "profile_pic", ""),
                "eodReminderTime": getattr(user, "eod_reminder_time", "22:00"),
                "eodReminderEnabled": getattr(user, "eod_reminder_enabled", True)
            }
        }, status=200)

    elif request.method == "PUT":
        data = request.data
        if "businessName" in data:
            user.business_name = data["businessName"]
        if "ownerFullName" in data:
            user.owner_full_name = data["ownerFullName"]
        if "businessType" in data:
            user.business_type = data["businessType"]
        if "themeColor" in data:
            user.theme_color = data["themeColor"]
        if "language" in data:
            user.language = data["language"]
        if "phoneNumber" in data:
            user.phone_number = data["phoneNumber"]
        if "profilePic" in data:
            user.profile_pic = data["profilePic"]
        if "eodReminderTime" in data:
            user.eod_reminder_time = data["eodReminderTime"]
        if "eodReminderEnabled" in data:
            user.eod_reminder_enabled = data["eodReminderEnabled"]
        user.save()

        return Response({
            "success": True,
            "message": "Profile updated successfully.",
            "user": {
                "email": user.email,
                "businessName": user.business_name,
                "ownerFullName": user.owner_full_name,
                "businessType": user.business_type,
                "themeColor": user.theme_color,
                "language": user.language,
                "phoneNumber": getattr(user, "phone_number", ""),
                "profilePic": getattr(user, "profile_pic", ""),
                "eodReminderTime": getattr(user, "eod_reminder_time", "22:00"),
                "eodReminderEnabled": getattr(user, "eod_reminder_enabled", True)
            }
        }, status=200)


@api_view(["POST"])
def refresh_token_view(request):
    refresh_token = request.data.get("refreshToken")
    if not refresh_token:
        return Response({"success": False, "message": "Refresh token is required."}, status=400)

    try:
        payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("token_type") != "refresh":
            return Response({"success": False, "message": "Invalid token type."}, status=400)

        email = payload.get("email")
        user = User.objects(email=email).first()
        if not user:
            return Response({"success": False, "message": "User not found."}, status=404)

        new_payload = {
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(days=1),
            "iat": datetime.utcnow(),
            "token_type": "access"
        }
        new_access_token = jwt.encode(new_payload, settings.JWT_SECRET, algorithm="HS256")

        return Response({
            "success": True,
            "accessToken": new_access_token
        }, status=200)
    except jwt.ExpiredSignatureError:
        return Response({"success": False, "message": "Refresh token expired. Please login again."}, status=401)
    except Exception:
        return Response({"success": False, "message": "Invalid refresh token."}, status=400)


@api_view(["GET"])
def notifications_list(request):
    # Parse Auth Header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("token_type") != "access":
            return Response({"success": False, "message": "Access token required."}, status=401)
        user_email = payload.get("email")
    except Exception:
        return Response({"success": False, "message": "Invalid token or session expired."}, status=401)

    user = User.objects(email=user_email).first()
    if not user:
        return Response({"success": False, "message": "User not found."}, status=404)

    try:
        from ledger.models import Entry, Udhaar
        import pytz
        from datetime import datetime, timedelta

        now = datetime.utcnow()
        # local time
        kolkata = pytz.timezone("Asia/Kolkata")
        now_local = datetime.now(kolkata)
        today_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        today_start_utc = today_start_local.astimezone(pytz.utc).replace(tzinfo=None)
        
        # 1. Inactivity reminder: if no entries for 2+ days
        last_entry = Entry.objects(user_email=user_email).order_by("-date").first()
        if last_entry:
            days_inactive = (now - last_entry.date).days
            if days_inactive >= 2:
                existing = Notification.objects(user_email=user_email, type="inactivity", created_at__gte=now - timedelta(days=1)).first()
                if not existing:
                    Notification(
                        user_email=user_email,
                        title="Inactivity Reminder",
                        message=f"You haven't recorded any transactions in the last {days_inactive} days. Keep your ledger updated!",
                        type="inactivity"
                    ).save()
        else:
            existing = Notification.objects(user_email=user_email, type="inactivity").first()
            if not existing:
                Notification(
                    user_email=user_email,
                    title="Get Started!",
                    message="You haven't recorded any entries yet. Try logging your first income or expense today!",
                    type="inactivity"
                ).save()

        # 2. Udhaar overdue reminder (pending 7+ days)
        overdue_udhaar = Udhaar.objects(user_email=user_email, status="pending")
        for u in overdue_udhaar:
            is_overdue = False
            if u.due_date and now >= u.due_date + timedelta(days=7):
                is_overdue = True
            elif not u.due_date and now >= u.created_at + timedelta(days=7):
                is_overdue = True
                
            if is_overdue:
                existing = Notification.objects(user_email=user_email, type="udhaar_overdue", message__contains=u.customer_name).first()
                if not existing:
                    Notification(
                        user_email=user_email,
                        title="Udhaar Overdue Alert",
                        message=f"Customer {u.customer_name}'s payment of ₹{u.amount} has been pending for over 7 days.",
                        type="udhaar_overdue"
                    ).save()

        # 3. Weekly/Monthly loss alert if expenses exceed income
        # Weekly stats
        week_start_utc = (today_start_local - timedelta(days=now_local.weekday())).astimezone(pytz.utc).replace(tzinfo=None)
        weekly_entries = Entry.objects(user_email=user_email, date__gte=week_start_utc)
        weekly_income = sum(e.amount for e in weekly_entries if e.type == "income")
        weekly_expense = sum(e.amount for e in weekly_entries if e.type == "expense")
        if weekly_expense > weekly_income:
            existing = Notification.objects(user_email=user_email, type="loss_alert_weekly", created_at__gte=week_start_utc).first()
            if not existing:
                Notification(
                    user_email=user_email,
                    title="Weekly Loss Alert",
                    message=f"Your weekly expenses (₹{weekly_expense}) exceed your income (₹{weekly_income}) by ₹{weekly_expense - weekly_income}.",
                    type="loss_alert_weekly"
                ).save()

        # Monthly stats
        month_start_utc = today_start_local.replace(day=1).astimezone(pytz.utc).replace(tzinfo=None)
        monthly_entries = Entry.objects(user_email=user_email, date__gte=month_start_utc)
        monthly_income = sum(e.amount for e in monthly_entries if e.type == "income")
        monthly_expense = sum(e.amount for e in monthly_entries if e.type == "expense")
        if monthly_expense > monthly_income:
            existing = Notification.objects(user_email=user_email, type="loss_alert_monthly", created_at__gte=month_start_utc).first()
            if not existing:
                Notification(
                    user_email=user_email,
                    title="Monthly Loss Alert",
                    message=f"Your monthly expenses (₹{monthly_expense}) exceed your income (₹{monthly_income}) by ₹{monthly_expense - monthly_income}.",
                    type="loss_alert_monthly"
                ).save()

        # 4. Weekly/Monthly summary notification
        # Weekly summary
        existing_weekly_summary = Notification.objects(user_email=user_email, type="summary_weekly", created_at__gte=week_start_utc).first()
        if not existing_weekly_summary and now >= week_start_utc + timedelta(days=5):
            Notification(
                user_email=user_email,
                title="Weekly Financial Summary",
                message=f"Weekly stats: Income ₹{weekly_income}, Expenses ₹{weekly_expense}. Net Profit: ₹{weekly_income - weekly_expense}.",
                type="summary_weekly"
            ).save()

        # Monthly summary
        existing_monthly_summary = Notification.objects(user_email=user_email, type="summary_monthly", created_at__gte=month_start_utc).first()
        if not existing_monthly_summary and now_local.day >= 25:
            Notification(
                user_email=user_email,
                title="Monthly Financial Summary",
                message=f"Monthly stats: Income ₹{monthly_income}, Expenses ₹{monthly_expense}. Net Profit: ₹{monthly_income - monthly_expense}.",
                type="summary_monthly"
            ).save()

        # 5. End-of-day reminder if no income entry logged by a set time
        if getattr(user, "eod_reminder_enabled", True):
            reminder_time_str = getattr(user, "eod_reminder_time", "22:00")
            try:
                rem_h, rem_m = map(int, reminder_time_str.split(":"))
                reminder_time_today = today_start_local.replace(hour=rem_h, minute=rem_m)
                if now_local >= reminder_time_today:
                    today_income_exists = Entry.objects(
                        user_email=user_email, 
                        type="income", 
                        date__gte=today_start_utc
                    ).first()
                    if not today_income_exists:
                        existing = Notification.objects(user_email=user_email, type="eod_reminder", created_at__gte=today_start_utc).first()
                        if not existing:
                            Notification(
                                user_email=user_email,
                                title="End-of-day Reminder",
                                message=f"You haven't logged any income entries today by your scheduled time of {reminder_time_str}.",
                                type="eod_reminder"
                            ).save()
            except Exception:
                pass
    except Exception as e:
        print("Error generating notifications:", e)

    notifs = Notification.objects(user_email=user_email, is_dismissed=False).order_by("-created_at")
    data_list = []
    for n in notifs:
        data_list.append({
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "isRead": n.is_read,
            "createdAt": n.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return Response({"success": True, "notifications": data_list}, status=200)


@api_view(["POST"])
def mark_notification_read(request, notif_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_email = payload.get("email")
    except Exception:
        return Response({"success": False, "message": "Invalid token."}, status=401)

    notif = Notification.objects(id=notif_id, user_email=user_email).first()
    if not notif:
        return Response({"success": False, "message": "Notification not found."}, status=404)
    notif.is_read = True
    notif.save()
    return Response({"success": True, "message": "Notification marked as read."}, status=200)


@api_view(["POST"])
def mark_notification_dismissed(request, notif_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_email = payload.get("email")
    except Exception:
        return Response({"success": False, "message": "Invalid token."}, status=401)

    notif = Notification.objects(id=notif_id, user_email=user_email).first()
    if not notif:
        return Response({"success": False, "message": "Notification not found."}, status=404)
    notif.is_dismissed = True
    notif.save()
    return Response({"success": True, "message": "Notification dismissed."}, status=200)