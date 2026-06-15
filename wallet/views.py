from decimal import Decimal

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .forms import LoginForm, SignupForm
from .models import (
    DailySpend,
    MerchantProfile,
    ParentAlert,
    School,
    Student,
    StudentControls,
    TransactionRecord,
    Wallet,
    get_or_create_daily_spend,
    local_today,
)
from .permissions import IsMerchant, IsParent
from .serializers import (
    LoginSerializer,
    MerchantPaymentSerializer,
    ParentControlsSerializer,
    PhotoVerifySerializer,
    SignupSerializer,
    TopUpSerializer,
    serialize_alert,
    serialize_transaction,
)
from .services import (
    apply_top_up,
    create_photo_challenge,
    process_payment,
    verify_photo_challenge,
)

User = get_user_model()


# ── helpers ──────────────────────────────────────────────────────────────────

def _get_default_school():
    school = School.objects.first()
    if not school:
        school = School.objects.create(name="Demo School", slug="demo-school")
    return school


def _redirect_authenticated(request):
    if hasattr(request.user, "merchant_profile"):
        return redirect("wallet:merchant_dashboard")
    if request.user.paisakid_children.exists():
        return redirect("wallet:parent_dashboard")
    return redirect("wallet:home")


# ── pages ─────────────────────────────────────────────────────────────────────

def home_page(request):
    if request.user.is_authenticated:
        if hasattr(request.user, "merchant_profile") or request.user.paisakid_children.exists():
            return _redirect_authenticated(request)
    return render(request, "wallet/home.html")


def login_page(request):
    if request.user.is_authenticated:
        if hasattr(request.user, "merchant_profile") or request.user.paisakid_children.exists():
            return _redirect_authenticated(request)
        return redirect("wallet:home")

    form = LoginForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        username = form.cleaned_data["username"].strip()
        password = form.cleaned_data["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if hasattr(user, "merchant_profile"):
                return redirect("wallet:merchant_dashboard")
            elif user.paisakid_children.exists():
                return redirect("wallet:parent_dashboard")
            return redirect("wallet:home")
        form.add_error(None, "Invalid username or password.")
    return render(request, "wallet/login.html", {"form": form})


def signup_page(request):
    if request.user.is_authenticated:
        return _redirect_authenticated(request)

    form = SignupForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        username = form.cleaned_data["username"].strip()
        password = form.cleaned_data["password1"]
        role = form.cleaned_data["role"]
        user = User.objects.create_user(username=username, password=password)
        school = _get_default_school()

        if role == "merchant":
            MerchantProfile.objects.create(
                user=user,
                display_name=form.cleaned_data.get("display_name") or username,
                outlet_name=form.cleaned_data.get("outlet_name") or "School Canteen",
                school=school,
            )
        elif role == "parent":
            student_code = f"S{user.id:03d}"
            student, _ = Student.objects.get_or_create(
                school=school,
                student_code=student_code,
                defaults={"full_name": f"{username}'s Child", "parent": user},
            )
            Wallet.objects.get_or_create(student=student, defaults={"balance_pkr": Decimal("0.00")})
            StudentControls.objects.get_or_create(
                student=student,
                defaults={"daily_limit_pkr": Decimal("500.00"), "purchases_enabled": True},
            )

        login(request, user)
        if hasattr(user, "merchant_profile"):
            return redirect("wallet:merchant_dashboard")
        return redirect("wallet:parent_dashboard")

    return render(request, "wallet/signup.html", {"form": form})


def logout_view(request):
    logout(request)
    return redirect("wallet:login")


@login_required(login_url="/login/")
def parent_dashboard(request):
    student = Student.objects.filter(parent=request.user).select_related("wallet", "controls").first()
    if not student:
        return render(request, "wallet/error.html", {"message": "No student linked to your account. Please contact support."})
    txs = TransactionRecord.objects.filter(student=student).order_by("-created_at")[:100]
    alerts = ParentAlert.objects.filter(student=student).order_by("-created_at")[:50]
    ds = get_or_create_daily_spend(student)
    return render(
        request,
        "wallet/dashboard_parent.html",
        {
            "child": student,
            "wallet": student.wallet,
            "controls": student.controls,
            "transactions": txs,
            "alerts": alerts,
            "user": request.user,
            "today_spent": ds.spent_pkr,
        },
    )


@login_required(login_url="/login/")
def merchant_dashboard(request):
    profile = getattr(request.user, "merchant_profile", None)
    if not profile:
        return render(request, "wallet/error.html", {"message": "No merchant profile found for your account."})

    qs = TransactionRecord.objects.filter(merchant_user=request.user).select_related("student")
    today = timezone.localtime().date()
    succeeded = qs.filter(tx_type=TransactionRecord.TxType.PURCHASE, status=TransactionRecord.Status.SUCCESS)
    today_sales = succeeded.filter(created_at__date=today)
    total_amt = sum((t.amount_pkr for t in succeeded), Decimal("0"))
    today_amt = sum((t.amount_pkr for t in today_sales), Decimal("0"))
    recent = qs.order_by("-created_at")[:50]
    return render(
        request,
        "wallet/dashboard_merchant.html",
        {
            "profile": profile,
            "transactions": recent,
            "summary": {
                "transactions_count": succeeded.count(),
                "total_sales": float(total_amt),
                "today_sales": float(today_amt),
                "today_count": today_sales.count(),
            },
            "user": request.user,
        },
    )


# ── REST API views ─────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    ser = LoginSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    username = ser.validated_data["username"].strip()
    password = ser.validated_data["password"]
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    role = "merchant" if hasattr(user, "merchant_profile") else "parent"
    return Response({"token": token.key, "username": user.username, "role": role})


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_api(request):
    ser = SignupSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data
    username = data["username"].strip()
    password = data["password"]
    role = data["role"]
    if User.objects.filter(username__iexact=username).exists():
        return Response({"detail": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, password=password)
    school = _get_default_school()
    if role == "merchant":
        MerchantProfile.objects.create(
            user=user,
            display_name=data.get("display_name", username),
            outlet_name=data.get("outlet_name", "School Canteen") or "School Canteen",
            school=school,
        )
    elif role == "parent":
        student_code = f"S{user.id:03d}"
        student, _ = Student.objects.get_or_create(
            school=school,
            student_code=student_code,
            defaults={"full_name": "Demo Student", "parent": user},
        )
        Wallet.objects.get_or_create(student=student, defaults={"balance_pkr": Decimal("0.00")})
        StudentControls.objects.get_or_create(
            student=student,
            defaults={"daily_limit_pkr": Decimal("500.00"), "purchases_enabled": True},
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "username": user.username, "role": role})


def _parent_student(request):
    code = request.query_params.get("student_code")
    qs = Student.objects.filter(parent=request.user).select_related("school", "wallet", "controls")
    if code:
        return get_object_or_404(qs, student_code__iexact=code.strip())
    return qs.first()


@api_view(["GET"])
@permission_classes([IsParent])
def parent_state_api(request):
    student = _parent_student(request)
    if not student:
        return Response({"detail": "No linked student"}, status=status.HTTP_404_NOT_FOUND)
    w = student.wallet
    ctr = student.controls
    ds = get_or_create_daily_spend(student)
    txs = TransactionRecord.objects.filter(student=student).order_by("-created_at")[:100]
    alerts = ParentAlert.objects.filter(parent=request.user, student=student).order_by("-created_at")[:50]
    parent = request.user
    first = parent.first_name or parent.username
    return Response(
        {
            "parentName": first,
            "childName": student.full_name,
            "studentId": student.student_code,
            "merchantName": "",
            "balance": float(w.balance_pkr),
            "dailyLimit": float(ctr.daily_limit_pkr),
            "todaySpent": float(ds.spent_pkr),
            "purchasesEnabled": ctr.purchases_enabled,
            "transactions": [serialize_transaction(t) for t in txs],
            "alerts": [serialize_alert(a) for a in alerts],
        }
    )


@api_view(["POST"])
@permission_classes([IsParent])
def parent_top_up_api(request):
    ser = TopUpSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    amount = ser.validated_data["amount"]
    if amount > Decimal("100000"):
        return Response({"detail": "Maximum top-up is PKR 100,000"}, status=status.HTTP_400_BAD_REQUEST)
    student = _parent_student(request)
    if not student:
        return Response({"detail": "No linked student"}, status=status.HTTP_404_NOT_FOUND)
    tx = apply_top_up(student, amount)
    return Response({"message": "Top-up ok", "transaction": serialize_transaction(tx)})


@api_view(["PATCH", "POST"])
@permission_classes([IsParent])
def parent_controls_api(request):
    ser = ParentControlsSerializer(data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    student = _parent_student(request)
    if not student:
        return Response({"detail": "No linked student"}, status=status.HTTP_404_NOT_FOUND)
    ctr = student.controls
    if "daily_limit_pkr" in ser.validated_data:
        ctr.daily_limit_pkr = ser.validated_data["daily_limit_pkr"]
    if "purchases_enabled" in ser.validated_data:
        ctr.purchases_enabled = ser.validated_data["purchases_enabled"]
    ctr.save()
    return Response({"message": "Updated"})


@api_view(["POST"])
@permission_classes([IsParent])
def parent_reset_day_api(request):
    student = _parent_student(request)
    if not student:
        return Response({"detail": "No linked student"}, status=status.HTTP_404_NOT_FOUND)
    DailySpend.objects.filter(student=student, date=local_today()).update(spent_pkr=Decimal("0"))
    return Response({"message": "Today's spend reset"})


@api_view(["POST"])
@permission_classes([IsParent])
def parent_dispute_api(request, tx_id):
    student = _parent_student(request)
    if not student:
        return Response({"detail": "No linked student"}, status=status.HTTP_404_NOT_FOUND)
    tx = get_object_or_404(TransactionRecord, pk=tx_id, student=student)
    if tx.tx_type != TransactionRecord.TxType.PURCHASE:
        return Response({"detail": "Cannot dispute"}, status=status.HTTP_400_BAD_REQUEST)
    tx.status = TransactionRecord.Status.FLAGGED
    tx.save(update_fields=["status"])
    ParentAlert.objects.create(
        parent=request.user,
        student=student,
        message=f"Transaction #{str(tx.id)[-8:]} disputed – review required.",
        severity=ParentAlert.Severity.WARNING,
    )
    return Response({"message": "Flagged"})


@api_view(["GET"])
@permission_classes([IsMerchant])
def merchant_state_api(request):
    mp = request.user.merchant_profile
    qs = TransactionRecord.objects.filter(merchant_user=request.user).select_related("student")
    today = timezone.localtime().date()
    succeeded = qs.filter(tx_type=TransactionRecord.TxType.PURCHASE, status=TransactionRecord.Status.SUCCESS)
    today_sales = succeeded.filter(created_at__date=today)
    total_amt = sum((t.amount_pkr for t in succeeded), Decimal("0"))
    today_amt = sum((t.amount_pkr for t in today_sales), Decimal("0"))
    recent = qs.order_by("-created_at")[:50]
    display = mp.display_name or request.user.username
    return Response(
        {
            "merchantName": display,
            "outletName": mp.outlet_name,
            "transactions": [serialize_transaction(t) for t in recent],
            "summary": {
                "transactionsCount": succeeded.count(),
                "totalSalesPkr": float(total_amt),
                "todaySalesPkr": float(today_amt),
                "todayCount": today_sales.count(),
            },
        }
    )


@api_view(["POST"])
@permission_classes([IsMerchant])
def merchant_payment_api(request):
    ser = MerchantPaymentSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    result = process_payment(
        merchant_user=request.user,
        student_code=d["student_id"],
        item=d["item"],
        amount_pkr=d["amount"],
        merchant_display_name=d.get("merchant") or "",
    )
    status_code = status.HTTP_200_OK if result["ok"] else status.HTTP_400_BAD_REQUEST
    return Response(result, status=status_code)


@api_view(["GET"])
@permission_classes([IsMerchant])
def student_lookup_api(request, student_code):
    mp = request.user.merchant_profile
    student = Student.objects.filter(school=mp.school, student_code__iexact=student_code.strip()).first()
    if not student:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    w = student.wallet
    photo_url = request.build_absolute_uri(student.photo.url) if student.photo else ""
    return Response(
        {
            "studentCode": student.student_code,
            "fullName": student.full_name,
            "balancePkr": float(w.balance_pkr),
            "photoUrl": photo_url,
        }
    )


@api_view(["GET"])
@permission_classes([IsMerchant])
def photo_challenge_api(request, student_code):
    mp = request.user.merchant_profile
    student = get_object_or_404(Student, school=mp.school, student_code__iexact=student_code.strip())
    data = create_photo_challenge(student)
    for p in data.get("photos", []):
        u = p.get("url") or ""
        if u.startswith("/"):
            p["url"] = request.build_absolute_uri(u)
    return Response(data)


@api_view(["POST"])
@permission_classes([IsMerchant])
def photo_verify_api(request, student_code):
    mp = request.user.merchant_profile
    student = get_object_or_404(Student, school=mp.school, student_code__iexact=student_code.strip())
    ser = PhotoVerifySerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ok, msg = verify_photo_challenge(
        str(ser.validated_data["challenge_token"]),
        ser.validated_data["selected_index"],
        student,
    )
    if ok:
        return Response({"verified": True, "message": msg})
    return Response({"verified": False, "message": msg}, status=status.HTTP_400_BAD_REQUEST)
