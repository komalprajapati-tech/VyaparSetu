from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from .models import Entry, Udhaar
import csv
from django.http import HttpResponse

def get_authenticated_user_email(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("token_type") == "access":
            return payload.get("email")
    except Exception as e:
        print("JWT decoding failed:", str(e))
        pass
    return None

@api_view(["GET", "POST"])
def entry_list_create(request):
    user_email = get_authenticated_user_email(request)
    if not user_email:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    if request.method == "GET":
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        entry_type = request.query_params.get("type")
        category = request.query_params.get("category")
        
        query = {"user_email": user_email}
        if entry_type:
            query["type"] = entry_type
        if category:
            query["category"] = category
            
        if start_date and end_date:
            try:
                s_dt = datetime.strptime(start_date, "%Y-%m-%d")
                e_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
                query["date__gte"] = s_dt
                query["date__lte"] = e_dt
            except ValueError:
                pass
                
        entries = Entry.objects(**query).order_by("-date")
        data_list = []
        for e in entries:
            data_list.append({
                "id": str(e.id),
                "amount": e.amount,
                "type": e.type,
                "category": e.category,
                "date": e.date.strftime("%Y-%m-%d"),
                "note": e.note,
                "receipt_img": e.receipt_img,
                "business_type": e.business_type
            })
        return Response({"success": True, "entries": data_list}, status=200)
        
    elif request.method == "POST":
        data = request.data
        amount = data.get("amount")
        entry_type = data.get("type")
        category = data.get("category")
        date_str = data.get("date")
        business_type = data.get("business_type")
        
        if amount is None or not entry_type or not category or not date_str or not business_type:
            return Response({"success": False, "message": "All fields are required."}, status=400)
            
        try:
            entry_date = datetime.strptime(date_str, "%Y-%m-%d")
            entry = Entry(
                user_email=user_email,
                amount=float(amount),
                type=entry_type,
                category=category,
                date=entry_date,
                note=data.get("note"),
                receipt_img=data.get("receipt_img"),
                business_type=business_type
            )
            entry.save()
            return Response({
                "success": True, 
                "message": "Entry added successfully.",
                "entry": {
                    "id": str(entry.id),
                    "amount": entry.amount,
                    "type": entry.type,
                    "category": entry.category,
                    "date": entry.date.strftime("%Y-%m-%d"),
                    "note": entry.note,
                    "receipt_img": entry.receipt_img,
                    "business_type": entry.business_type
                }
            }, status=201)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=400)

@api_view(["PUT", "DELETE"])
def entry_detail(request, entry_id):
    user_email = get_authenticated_user_email(request)
    if not user_email:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    entry = Entry.objects(id=entry_id, user_email=user_email).first()
    if not entry:
        return Response({"success": False, "message": "Entry not found."}, status=404)
        
    if request.method == "PUT":
        data = request.data
        try:
            if "amount" in data:
                entry.amount = float(data["amount"])
            if "type" in data:
                entry.type = data["type"]
            if "category" in data:
                entry.category = data["category"]
            if "date" in data:
                entry.date = datetime.strptime(data["date"], "%Y-%m-%d")
            if "note" in data:
                entry.note = data["note"]
            if "receipt_img" in data:
                entry.receipt_img = data["receipt_img"]
            if "business_type" in data:
                entry.business_type = data["business_type"]
            entry.save()
            return Response({"success": True, "message": "Entry updated successfully."}, status=200)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=400)
            
    elif request.method == "DELETE":
        entry.delete()
        return Response({"success": True, "message": "Entry deleted successfully."}, status=200)

@api_view(["GET", "POST"])
def udhaar_list_create(request):
    user_email = get_authenticated_user_email(request)
    if not user_email:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    if request.method == "GET":
        status_filter = request.query_params.get("status")
        query = {"user_email": user_email}
        if status_filter:
            query["status"] = status_filter
            
        udhaar_records = Udhaar.objects(**query).order_by("-created_at")
        data_list = []
        for u in udhaar_records:
            data_list.append({
                "id": str(u.id),
                "customer_name": u.customer_name,
                "amount": u.amount,
                "due_date": u.due_date.strftime("%Y-%m-%d") if u.due_date else None,
                "status": u.status,
                "created_at": u.created_at.strftime("%Y-%m-%d")
            })
        return Response({"success": True, "udhaar": data_list}, status=200)
        
    elif request.method == "POST":
        data = request.data
        customer_name = data.get("customer_name")
        amount = data.get("amount")
        due_date_str = data.get("due_date")
        
        if not customer_name or amount is None:
            return Response({"success": False, "message": "Customer name and amount are required."}, status=400)
            
        try:
            due_date = None
            if due_date_str:
                due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
                
            udhaar = Udhaar(
                user_email=user_email,
                customer_name=customer_name,
                amount=float(amount),
                due_date=due_date,
                status="pending"
            )
            udhaar.save()
            return Response({
                "success": True,
                "message": "Udhaar entry created successfully.",
                "udhaar": {
                    "id": str(udhaar.id),
                    "customer_name": udhaar.customer_name,
                    "amount": udhaar.amount,
                    "due_date": udhaar.due_date.strftime("%Y-%m-%d") if udhaar.due_date else None,
                    "status": udhaar.status
                }
            }, status=201)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=400)

@api_view(["PUT", "DELETE"])
def udhaar_detail(request, udhaar_id):
    user_email = get_authenticated_user_email(request)
    if not user_email:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    udhaar = Udhaar.objects(id=udhaar_id, user_email=user_email).first()
    if not udhaar:
        return Response({"success": False, "message": "Udhaar record not found."}, status=404)
        
    if request.method == "PUT":
        data = request.data
        try:
            if "customer_name" in data:
                udhaar.customer_name = data["customer_name"]
            if "amount" in data:
                udhaar.amount = float(data["amount"])
            if "due_date" in data:
                due_date_str = data["due_date"]
                udhaar.due_date = datetime.strptime(due_date_str, "%Y-%m-%d") if due_date_str else None
            if "status" in data:
                udhaar.status = data["status"]
            udhaar.save()
            return Response({"success": True, "message": "Udhaar updated successfully."}, status=200)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=400)
            
    elif request.method == "DELETE":
        udhaar.delete()
        return Response({"success": True, "message": "Udhaar deleted successfully."}, status=200)

@api_view(["GET"])
def ledger_summary(request):
    user_email = get_authenticated_user_email(request)
    if not user_email:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    now = datetime.utcnow()
    
    # Query parameters
    date_str = request.query_params.get("date") # YYYY-MM-DD
    period = request.query_params.get("period", "month").lower() # today, week, month, year
    
    if date_str:
        try:
            start_date = datetime.strptime(date_str, "%Y-%m-%d")
            end_date = start_date + timedelta(days=1)
            period = "date"
        except ValueError:
            return Response({"success": False, "message": "Invalid date format. Use YYYY-MM-DD."}, status=400)
    else:
        today_start = datetime(now.year, now.month, now.day)
        if period == "today":
            start_date = today_start
            end_date = today_start + timedelta(days=1)
        elif period == "week":
            start_date = today_start - timedelta(days=today_start.weekday())
            end_date = today_start + timedelta(days=1)
        elif period == "year":
            start_date = datetime(now.year, 1, 1)
            end_date = today_start + timedelta(days=1)
        else: # month
            start_date = datetime(now.year, now.month, 1)
            end_date = today_start + timedelta(days=1)
            period = "month"

    # Filtered entries for the selected range
    period_entries = Entry.objects(user_email=user_email, date__gte=start_date, date__lt=end_date)
    period_income = sum(e.amount for e in period_entries if e.type == "income")
    period_expense = sum(e.amount for e in period_entries if e.type == "expense")
    period_net = period_income - period_expense
    
    # Static card values (fallbacks for overall UI reference)
    today_start_static = datetime(now.year, now.month, now.day)
    week_start_static = today_start_static - timedelta(days=today_start_static.weekday())
    month_start_static = datetime(now.year, now.month, 1)
    
    today_entries = Entry.objects(user_email=user_email, date__gte=today_start_static)
    today_income = sum(e.amount for e in today_entries if e.type == "income")
    today_expense = sum(e.amount for e in today_entries if e.type == "expense")
    
    weekly_entries = Entry.objects(user_email=user_email, date__gte=week_start_static)
    weekly_income = sum(e.amount for e in weekly_entries if e.type == "income")
    weekly_expense = sum(e.amount for e in weekly_entries if e.type == "expense")
    
    monthly_entries = Entry.objects(user_email=user_email, date__gte=month_start_static)
    monthly_income = sum(e.amount for e in monthly_entries if e.type == "income")
    monthly_expense = sum(e.amount for e in monthly_entries if e.type == "expense")
    
    # Expense category breakdown for the selected period
    category_map = {}
    for exp in period_entries:
        if exp.type == "expense":
            category_map[exp.category] = category_map.get(exp.category, 0.0) + exp.amount
    expense_categories = [{"category": k, "amount": v} for k, v in category_map.items()]
    
    # Dynamic Trend data
    trend_data = []
    if period == "year":
        for m in range(1, 13):
            m_start = datetime(start_date.year, m, 1)
            if m == 12:
                m_end = datetime(start_date.year + 1, 1, 1)
            else:
                m_end = datetime(start_date.year, m + 1, 1)
            m_entries = Entry.objects(user_email=user_email, date__gte=m_start, date__lt=m_end)
            m_income = sum(e.amount for e in m_entries if e.type == "income")
            m_expense = sum(e.amount for e in m_entries if e.type == "expense")
            trend_data.append({
                "date": m_start.strftime("%b"),
                "income": m_income,
                "expense": m_expense
            })
    elif period == "month":
        # 4 weekly segments of the month
        for w in range(4):
            w_start = start_date + timedelta(days=w*7)
            w_end = w_start + timedelta(days=7)
            if w == 3:
                if start_date.month == 12:
                    w_end = datetime(start_date.year + 1, 1, 1)
                else:
                    w_end = datetime(start_date.year, start_date.month + 1, 1)
            w_entries = Entry.objects(user_email=user_email, date__gte=w_start, date__lt=w_end)
            w_income = sum(e.amount for e in w_entries if e.type == "income")
            w_expense = sum(e.amount for e in w_entries if e.type == "expense")
            trend_data.append({
                "date": f"Week {w+1}",
                "income": w_income,
                "expense": w_expense
            })
    else: # today, week, or specific date
        # daily trend for the last 7 days ending at end_date
        for i in range(6, -1, -1):
            day = end_date - timedelta(days=i+1)
            day_start = datetime(day.year, day.month, day.day)
            day_end = day_start + timedelta(days=1)
            day_entries = Entry.objects(user_email=user_email, date__gte=day_start, date__lt=day_end)
            day_income = sum(e.amount for e in day_entries if e.type == "income")
            day_expense = sum(e.amount for e in day_entries if e.type == "expense")
            trend_data.append({
                "date": day_start.strftime("%b %d"),
                "income": day_income,
                "expense": day_expense
            })
        
    # Recent activity (last 5 entries in the selected range)
    recent_entries = period_entries.order_by("-date")[:5]
    recent_list = []
    for e in recent_entries:
        recent_list.append({
            "id": str(e.id),
            "amount": e.amount,
            "type": e.type,
            "category": e.category,
            "date": e.date.strftime("%Y-%m-%d"),
            "note": e.note
        })
        
    # Pending credit summary (Udhaar)
    pending_udhaar = Udhaar.objects(user_email=user_email, status="pending")
    total_pending_udhaar = sum(u.amount for u in pending_udhaar)
    
    return Response({
        "success": True,
        "summary": {
            "period": period,
            "income": period_income,
            "expense": period_expense,
            "net": period_net,
            "today": {
                "income": today_income,
                "expense": today_expense,
                "net": today_income - today_expense
            },
            "weekly": {
                "income": weekly_income,
                "expense": weekly_expense,
                "net": weekly_income - weekly_expense
            },
            "monthly": {
                "income": monthly_income,
                "expense": monthly_expense,
                "net": monthly_income - monthly_expense
            },
            "expense_categories": expense_categories,
            "trend": trend_data,
            "recent_activity": recent_list,
            "total_pending_udhaar": total_pending_udhaar
        }
    }, status=200)

@api_view(["GET"])
def export_report(request):
    user_email = get_authenticated_user_email(request)
    if not user_email:
        return HttpResponse("Unauthorized", status=401)
        
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")
    entry_type = request.query_params.get("type")
    
    query = {"user_email": user_email}
    if entry_type:
        query["type"] = entry_type
        
    if start_date and end_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d")
            e_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            query["date__gte"] = s_dt
            query["date__lte"] = e_dt
        except ValueError:
            pass
            
    entries = Entry.objects(**query).order_by("-date")
    
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="ledger_report.csv"'
    
    writer = csv.writer(response)
    writer.writerow(["Date", "Type", "Category", "Amount", "Note", "Business Type"])
    
    for e in entries:
        writer.writerow([
            e.date.strftime("%Y-%m-%d"),
            e.type.upper(),
            e.category,
            e.amount,
            e.note or "",
            e.business_type
        ])
        
    return response
