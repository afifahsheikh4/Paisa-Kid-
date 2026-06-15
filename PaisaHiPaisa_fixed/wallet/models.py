import uuid
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class School(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)

    def __str__(self) -> str:
        return self.name


class MerchantProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="merchant_profile")
    display_name = models.CharField(max_length=120)
    outlet_name = models.CharField(max_length=200, default="School Canteen")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="merchants")

    def __str__(self) -> str:
        return f"{self.display_name} ({self.outlet_name})"


class Student(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="students")
    student_code = models.CharField(max_length=20)
    full_name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to="students/", blank=True, null=True)
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name="paisakid_children")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["school", "student_code"], name="uniq_student_code_per_school"),
        ]
        ordering = ["student_code"]

    def __str__(self) -> str:
        return f"{self.student_code} — {self.full_name}"


class Wallet(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="wallet")
    balance_pkr = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    def __str__(self) -> str:
        return f"Wallet {self.student_id}: {self.balance_pkr}"


class StudentControls(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="controls")
    daily_limit_pkr = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("500.00"))
    purchases_enabled = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"Controls for {self.student}"


class DailySpend(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="daily_spends")
    date = models.DateField()
    spent_pkr = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "date"], name="uniq_daily_spend_per_day"),
        ]


class TransactionRecord(models.Model):
    class TxType(models.TextChoices):
        TOPUP = "topup", "Top-up"
        PURCHASE = "purchase", "Purchase"

    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        FLAGGED = "flagged", "Flagged"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="transactions")
    tx_type = models.CharField(max_length=20, choices=TxType.choices)
    amount_pkr = models.DecimalField(max_digits=12, decimal_places=2)
    merchant_name = models.CharField(max_length=200, blank=True)
    item_name = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    failure_reason = models.TextField(blank=True)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    merchant_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="merchant_transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.tx_type} {self.amount_pkr} ({self.status})"


class ParentAlert(models.Model):
    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        DANGER = "danger", "Danger"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name="paisakid_alerts")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="alerts")
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.WARNING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class PhotoChallengeSession(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="photo_challenges")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    correct_index = models.PositiveSmallIntegerField()
    choice_student_ids = models.JSONField()
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


def local_today():
    tz = timezone.get_current_timezone()
    return timezone.localdate(timezone=tz)


def get_or_create_daily_spend(student: Student) -> DailySpend:
    d = local_today()
    obj, _ = DailySpend.objects.get_or_create(student=student, date=d, defaults={"spent_pkr": Decimal("0")})
    return obj
