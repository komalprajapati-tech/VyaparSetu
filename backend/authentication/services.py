from .models import User, OTP, ResetOTP
from django.contrib.auth.hashers import make_password
import random
from datetime import datetime, timedelta
import requests
from django.conf import settings
import os
import bcrypt


def generate_otp():
    return str(random.randint(100000, 999999))


def email_exists(email):
    return User.objects(email=email).first() is not None


def hash_otp(otp: str) -> str:
    return bcrypt.hashpw(otp.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_otp_hash(otp: str, hashed_otp: str) -> bool:
    return bcrypt.checkpw(otp.encode("utf-8"), hashed_otp.encode("utf-8"))


def check_rate_limit(user) -> bool:
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    
    # Clean up old timestamps
    user.otp_request_timestamps = [
        t for t in user.otp_request_timestamps 
        if t.replace(tzinfo=None) > one_hour_ago
    ]
    
    # Max 5 requests per hour
    if len(user.otp_request_timestamps) >= 5:
        return False
        
    user.otp_request_timestamps.append(now)
    user.save()
    return True


def create_and_save_otp(email: str, otp: str):
    otp_hash = hash_otp(otp)
    otp_doc = OTP.objects(email=email).first()
    if otp_doc:
        otp_doc.otp_hash = otp_hash
        otp_doc.attempts = 0
        otp_doc.created_at = datetime.utcnow()
        otp_doc.expires_at = datetime.utcnow() + timedelta(minutes=5)
    else:
        otp_doc = OTP(
            email=email,
            otp_hash=otp_hash,
            attempts=0,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
    otp_doc.save()


def send_otp_email(email, otp):
    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [
            {
                "email": email
            }
        ],
        "subject": "Verify Your LekhBook Account",
        "htmlContent": f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to LekhBook</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #10b981; font-size: 32px; letter-spacing: 2px;">{otp}</h1>
            <p>This OTP is valid for 5 minutes.</p>
            <br>
            <p>If you didn't request this email, please ignore it.</p>
        </div>
        """,
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 201:
            print(f"[OK] Email sent successfully to {email}")
            return True
        else:
            print(f"[ERROR] Brevo failed to send email. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            try:
                log_path = os.path.join(settings.BASE_DIR, "brevo_debug.log")
                with open(log_path, "a") as f:
                    f.write(f"[{datetime.utcnow()}] Failed to send to {email}. Status: {response.status_code}. Response: {response.text}\n")
            except Exception as log_error:
                print(f"Failed to write to debug log: {log_error}")
            
            if settings.DEBUG:
                print(f"\n========================================================")
                print(f"[DEBUG FALLBACK] Brevo failed. OTP for {email} is: {otp}")
                print(f"========================================================\n")
                return True
            return False
    except Exception as e:
        print(f"[ERROR] Connection to Brevo failed: {e}")
        try:
            log_path = os.path.join(settings.BASE_DIR, "brevo_debug.log")
            with open(log_path, "a") as f:
                f.write(f"[{datetime.utcnow()}] Connection error to Brevo. Details: {e}\n")
        except Exception as log_error:
            print(f"Failed to write to debug log: {log_error}")
        
        if settings.DEBUG:
            print(f"\n========================================================")
            print(f"[DEBUG FALLBACK] Brevo connection failed. OTP for {email} is: {otp}")
            print(f"========================================================\n")
            return True
        return False


def create_user(data):
    hashed_password = make_password(data["password"])
    otp = generate_otp()

    user = User(
        business_name=data["businessName"],
        owner_full_name=data["ownerFullName"],
        email=data["email"],
        password_hash=hashed_password,
        otp_request_timestamps=[datetime.utcnow()],
        is_verified=False
    )
    user.save()
    
    # Save the OTP
    create_and_save_otp(user.email, otp)
    
    # Trigger the OTP email send
    email_sent = send_otp_email(user.email, otp)
    
    return user, email_sent


def resend_otp_service(email: str):
    user = User.objects(email=email).first()
    if not user:
        return False, "User not found."
    
    if user.is_verified:
        return False, "Email already verified."
        
    # Check rate limit
    if not check_rate_limit(user):
        return False, "Too many OTP requests. Please try again after 1 hour."
        
    # Generate new OTP
    otp = generate_otp()
    
    # Save hashed OTP
    create_and_save_otp(user.email, otp)
    
    # Send email
    email_sent = send_otp_email(user.email, otp)
    if not email_sent:
        return False, "Failed to send OTP email. Please try again later."
        
    return True, "OTP sent to your email."


def send_reset_otp_email(email, otp):
    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [
            {
                "email": email
            }
        ],
        "subject": "Reset Your LekhBook Password",
        "htmlContent": f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>LekhBook Password Reset</h2>
            <p>You requested to reset your password. Use the verification code below to proceed:</p>
            <h1 style="color: #ef4444; font-size: 32px; letter-spacing: 2px;">{otp}</h1>
            <p>This reset code is valid for 5 minutes.</p>
            <br>
            <p>If you didn't request this, please ignore this email or contact support if you suspect unauthorized access.</p>
        </div>
        """,
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 201:
            print(f"[OK] Reset email sent successfully to {email}")
            return True
        else:
            print(f"[ERROR] Brevo failed to send reset email. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            try:
                log_path = os.path.join(settings.BASE_DIR, "brevo_debug.log")
                with open(log_path, "a") as f:
                    f.write(f"[{datetime.utcnow()}] Failed to send reset to {email}. Status: {response.status_code}. Response: {response.text}\n")
            except Exception as log_error:
                print(f"Failed to write to debug log: {log_error}")
            
            if settings.DEBUG:
                print(f"\n========================================================")
                print(f"[DEBUG FALLBACK] Brevo failed. Reset OTP for {email} is: {otp}")
                print(f"========================================================\n")
                return True
            return False
    except Exception as e:
        print(f"[ERROR] Connection to Brevo failed: {e}")
        try:
            log_path = os.path.join(settings.BASE_DIR, "brevo_debug.log")
            with open(log_path, "a") as f:
                f.write(f"[{datetime.utcnow()}] Connection error to Brevo. Details: {e}\n")
        except Exception as log_error:
            print(f"Failed to write to debug log: {log_error}")
        
        if settings.DEBUG:
            print(f"\n========================================================")
            print(f"[DEBUG FALLBACK] Brevo connection failed. Reset OTP for {email} is: {otp}")
            print(f"========================================================\n")
            return True
        return False


def create_and_save_reset_otp(email: str, otp: str):
    otp_hash = hash_otp(otp)
    otp_doc = ResetOTP.objects(email=email).first()
    if otp_doc:
        otp_doc.otp_hash = otp_hash
        otp_doc.attempts = 0
        otp_doc.created_at = datetime.utcnow()
        otp_doc.expires_at = datetime.utcnow() + timedelta(minutes=5)
    else:
        otp_doc = ResetOTP(
            email=email,
            otp_hash=otp_hash,
            attempts=0,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
    otp_doc.save()


def forgot_password_service(email: str):
    user = User.objects(email=email).first()
    if not user:
        return False, "Email not registered."

    # Check rate limit
    if not check_rate_limit(user):
        return False, "Too many OTP requests. Please try again after 1 hour."

    # Generate OTP
    otp = generate_otp()

    # Save hashed reset OTP
    create_and_save_reset_otp(email, otp)

    # Send reset email
    email_sent = send_reset_otp_email(email, otp)
    if not email_sent:
        return False, "Failed to send verification email. Please try again later."

    return True, "Reset OTP sent to your email."