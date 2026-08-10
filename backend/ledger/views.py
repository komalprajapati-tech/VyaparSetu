from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from .models import Entry, Udhaar, Product, Bill
import csv
from django.http import HttpResponse
from mongoengine.context_managers import switch_db
from authentication.services import get_db_alias

def get_authenticated_user_info(request):
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        token = request.query_params.get("token") or request.query_params.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]

    if not token:
        return None, None, None

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("token_type") == "access":
            email = payload.get("email")
            b_type = payload.get("business_type") or payload.get("businessType") or "retailer"
            alias = get_db_alias(b_type)
            return email, b_type, alias
    except Exception as e:
        print("JWT decoding failed:", str(e))
        pass
    return None, None, None

def get_authenticated_user_email(request):
    email, _, _ = get_authenticated_user_info(request)
    return email

@api_view(["GET", "POST"])
def entry_list_create(request):
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    with switch_db(Entry, alias):
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
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    with switch_db(Entry, alias):
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
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    with switch_db(Udhaar, alias):
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
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)
        
    with switch_db(Udhaar, alias):
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
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
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
            end_date = start_date + timedelta(days=7)
        elif period == "year":
            start_date = datetime(now.year, 1, 1)
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1)
            else:
                end_date = datetime(now.year, now.month + 1, 1)
        else: # month
            start_date = datetime(now.year, now.month, 1)
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1)
            else:
                end_date = datetime(now.year, now.month + 1, 1)
            period = "month"

    with switch_db(Entry, alias), switch_db(Udhaar, alias):
        # Filtered entries for the selected range
        period_entries = Entry.objects(user_email=user_email, date__gte=start_date, date__lt=end_date)
        period_income = sum(e.amount for e in period_entries if e.type == "income")
        period_expense = sum(e.amount for e in period_entries if e.type == "expense")
        period_net = period_income - period_expense
        
        # Static card values
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
        elif period == "week":
            # 7 days of the selected week (Mon to Sun)
            days_name = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            for i in range(7):
                d_start = start_date + timedelta(days=i)
                d_end = d_start + timedelta(days=1)
                d_entries = Entry.objects(user_email=user_email, date__gte=d_start, date__lt=d_end)
                d_income = sum(e.amount for e in d_entries if e.type == "income")
                d_expense = sum(e.amount for e in d_entries if e.type == "expense")
                trend_data.append({
                    "date": f"{days_name[i]} {d_start.strftime('%d')}",
                    "income": d_income,
                    "expense": d_expense
                })
        else: # today or specific date
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
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
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
            
    with switch_db(Entry, alias):
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


# ==========================================
# FOOD BUSINESS (RESTAURANT / CAFE) MODULE VIEWS
# ==========================================

@api_view(["GET", "POST"])
def product_list_create(request):
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)

    with switch_db(Product, alias):
        if request.method == "GET":
            category = request.query_params.get("category")
            search = request.query_params.get("search")
            available_only = request.query_params.get("available_only")

            query = {"user_email": user_email}
            if category and category.lower() != "all":
                query["category"] = category
            if available_only == "true":
                query["is_available"] = True

            products = Product.objects(**query).order_by("category", "name")
            data_list = []
            for p in products:
                if search and search.lower() not in p.name.lower() and search.lower() not in p.category.lower():
                    continue
                data_list.append({
                    "id": str(p.id),
                    "name": p.name,
                    "category": p.category,
                    "price": p.price,
                    "is_veg": p.is_veg,
                    "is_available": p.is_available,
                    "variants": p.variants or [],
                    "created_at": p.created_at.strftime("%Y-%m-%d")
                })
            return Response({"success": True, "products": data_list}, status=200)

        elif request.method == "POST":
            data = request.data
            name = data.get("name")
            category = data.get("category", "General")
            price = data.get("price")
            is_veg = data.get("is_veg", True)
            is_available = data.get("is_available", True)
            variants = data.get("variants", [])

            if not name or price is None:
                return Response({"success": False, "message": "Product name and price are required."}, status=400)

            try:
                prod = Product(
                    user_email=user_email,
                    name=name.strip(),
                    category=category.strip() if category else "General",
                    price=float(price),
                    is_veg=bool(is_veg),
                    is_available=bool(is_available),
                    variants=variants if isinstance(variants, list) else []
                )
                prod.save()
                return Response({
                    "success": True,
                    "message": "Product created successfully.",
                    "product": {
                        "id": str(prod.id),
                        "name": prod.name,
                        "category": prod.category,
                        "price": prod.price,
                        "is_veg": prod.is_veg,
                        "is_available": prod.is_available,
                        "variants": prod.variants
                    }
                }, status=201)
            except Exception as e:
                return Response({"success": False, "message": str(e)}, status=400)


@api_view(["PUT", "DELETE"])
def product_detail(request, product_id):
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)

    with switch_db(Product, alias):
        prod = Product.objects(id=product_id, user_email=user_email).first()
        if not prod:
            return Response({"success": False, "message": "Product not found."}, status=404)

        if request.method == "PUT":
            data = request.data
            try:
                if "name" in data:
                    prod.name = data["name"].strip()
                if "category" in data:
                    prod.category = data["category"].strip()
                if "price" in data:
                    prod.price = float(data["price"])
                if "is_veg" in data:
                    prod.is_veg = bool(data["is_veg"])
                if "is_available" in data:
                    prod.is_available = bool(data["is_available"])
                if "variants" in data:
                    prod.variants = data["variants"] if isinstance(data["variants"], list) else []

                prod.save()
                return Response({"success": True, "message": "Product updated successfully."}, status=200)
            except Exception as e:
                return Response({"success": False, "message": str(e)}, status=400)

        elif request.method == "DELETE":
            prod.delete()
            return Response({"success": True, "message": "Product deleted successfully."}, status=200)


@api_view(["POST"])
def billing_generate(request):
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)

    data = request.data
    items = data.get("items", [])
    discount = float(data.get("discount", 0.0))

    if not items or not isinstance(items, list):
        return Response({"success": False, "message": "At least one item is required to generate a bill."}, status=400)

    try:
        subtotal = 0.0
        processed_items = []
        for item in items:
            p_name = item.get("name", "Item")
            variant = item.get("variant", "")
            price = float(item.get("price", 0))
            qty = int(item.get("quantity", 1))
            line_total = price * qty
            subtotal += line_total
            processed_items.append({
                "name": p_name,
                "variant": variant,
                "price": price,
                "quantity": qty,
                "line_total": line_total
            })

        discount_amount = discount
        grand_total = max(0.0, subtotal - discount_amount)

        # Generate unique Bill Number (BILL-YYYYMMDD-HHMMSS)
        timestamp_str = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        bill_number = f"BILL-{timestamp_str[-8:]}"

        items_summary = ", ".join([f"{i['name']}{' (' + i['variant'] + ')' if i['variant'] else ''} x{i['quantity']}" for i in processed_items[:3]])
        if len(processed_items) > 3:
            items_summary += f" +{len(processed_items) - 3} more"

        with switch_db(Entry, alias), switch_db(Bill, alias):
            # 1. Create linked Entry document in profit/loss ledger
            entry = Entry(
                user_email=user_email,
                amount=grand_total,
                type="income",
                category="Restaurant Sales",
                date=datetime.utcnow(),
                note=f"Receipt #{bill_number}: {items_summary}",
                business_type="food"
            )
            entry.save()

            # 2. Create Bill Document
            bill = Bill(
                user_email=user_email,
                bill_number=bill_number,
                items=processed_items,
                subtotal=subtotal,
                discount=discount_amount,
                grand_total=grand_total,
                entry_id=str(entry.id)
            )
            bill.save()

            return Response({
                "success": True,
                "message": "Bill generated successfully.",
                "bill": {
                    "id": str(bill.id),
                    "bill_number": bill.bill_number,
                    "items": bill.items,
                    "subtotal": bill.subtotal,
                    "discount": bill.discount,
                    "grand_total": bill.grand_total,
                    "created_at": bill.created_at.strftime("%Y-%m-%d %H:%M:%S")
                }
            }, status=201)

    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=400)


@api_view(["GET"])
def billing_history(request):
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)

    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    query = {"user_email": user_email}
    if start_date and end_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d")
            e_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            query["created_at__gte"] = s_dt
            query["created_at__lte"] = e_dt
        except ValueError:
            pass

    with switch_db(Bill, alias):
        bills = Bill.objects(**query).order_by("-created_at")
        data_list = []
        for b in bills:
            data_list.append({
                "id": str(b.id),
                "bill_number": b.bill_number,
                "items": b.items,
                "subtotal": b.subtotal,
                "discount": b.discount,
                "grand_total": b.grand_total,
                "created_at": b.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        return Response({"success": True, "bills": data_list}, status=200)


@api_view(["GET"])
def restaurant_dashboard_summary(request):
    user_email, business_type, alias = get_authenticated_user_info(request)
    if not user_email or not alias:
        return Response({"success": False, "message": "Unauthorized access."}, status=401)

    filter_range = request.query_params.get("range", "today")
    now = datetime.utcnow()
    
    if filter_range == "week":
        start_date = now - timedelta(days=7)
    elif filter_range == "month":
        start_date = now - timedelta(days=30)
    elif filter_range == "year":
        start_date = now - timedelta(days=365)
    else: # today
        start_date = datetime(now.year, now.month, now.day)

    with switch_db(Bill, alias), switch_db(Entry, alias):
        # Fetch bills in period
        bills = Bill.objects(user_email=user_email, created_at__gte=start_date)
        period_sales = sum(b.grand_total for b in bills)
        period_bills_count = bills.count()
        avg_bill_value = (period_sales / period_bills_count) if period_bills_count > 0 else 0.0

        # Fetch income & expenses in period from Entry table
        entries = Entry.objects(user_email=user_email, date__gte=start_date)
        income_total = sum(e.amount for e in entries if e.type == "income")
        expense_total = sum(e.amount for e in entries if e.type == "expense")
        net_profit = income_total - expense_total

        # Top selling products calculation
        product_stats = {}
        for b in bills:
            for item in b.items:
                key = item.get("name", "Item")
                if item.get("variant"):
                    key += f" ({item.get('variant')})"
                if key not in product_stats:
                    product_stats[key] = {"quantity": 0, "revenue": 0.0}
                product_stats[key]["quantity"] += item.get("quantity", 1)
                product_stats[key]["revenue"] += item.get("line_total", 0.0)

        top_products = sorted(
            [{"name": k, "quantity": v["quantity"], "revenue": v["revenue"]} for k, v in product_stats.items()],
            key=lambda x: x["quantity"],
            reverse=True
        )[:5]

        # Sales trend points
        trend_data = []
        if filter_range in ["today", "week"]:
            num_days = 7 if filter_range == "week" else 1
            for i in range(num_days - 1, -1, -1):
                day_dt = now - timedelta(days=i)
                day_start = datetime(day_dt.year, day_dt.month, day_dt.day)
                day_end = day_start + timedelta(days=1) - timedelta(seconds=1)
                day_bills = [b for b in bills if day_start <= b.created_at <= day_end]
                day_sales = sum(b.grand_total for b in day_bills)
                trend_data.append({
                    "label": day_dt.strftime("%a") if filter_range == "week" else day_dt.strftime("%H:00"),
                    "sales": day_sales
                })
        else:
            num_weeks = 4 if filter_range == "month" else 12
            for i in range(num_weeks - 1, -1, -1):
                w_start = now - timedelta(weeks=i+1)
                w_end = now - timedelta(weeks=i)
                w_bills = [b for b in bills if w_start <= b.created_at <= w_end]
                w_sales = sum(b.grand_total for b in w_bills)
                trend_data.append({
                    "label": f"W{num_weeks - i}",
                    "sales": w_sales
                })

        return Response({
            "success": True,
            "summary": {
                "period_sales": period_sales,
                "bills_count": period_bills_count,
                "avg_bill_value": avg_bill_value,
                "income": income_total,
                "expense": expense_total,
                "net_profit": net_profit,
                "top_products": top_products,
                "trend": trend_data
            }
        }, status=200)

