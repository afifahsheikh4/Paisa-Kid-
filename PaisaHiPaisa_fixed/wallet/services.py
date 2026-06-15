from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.contrib.auth.models import User
from django.db import transaction as db_transaction
from django.utils import timezone

from .models import (
    DailySpend,
    MerchantProfile,
    ParentAlert,
    PhotoChallengeSession,
    Student,
    TransactionRecord,
    Wallet,
    get_or_create_daily_spend,
)
from .serializers import serialize_transaction


def _rapid_purchase_alert(student: Student):
    cutoff = timezone.now() - timedelta(seconds=60)
    recent = TransactionRecord.objects.filter(
        student=student,
        tx_type=TransactionRecord.TxType.PURCHASE,
        status=TransactionRecord.Status.SUCCESS,
        created_at__gte=cutoff,
    ).count()
    if recent >= 3:
        ParentAlert.objects.create(
            parent=student.parent,
            student=student,
            message="Multiple rapid transactions detected – review activity.",
            severity=ParentAlert.Severity.DANGER,
        )


def _validate_student_code(code: str) -> bool:
    import re

    return bool(re.fullmatch(r"S\d{3}", code.strip()))


def process_payment(
    *,
    merchant_user: User,
    student_code: str,
    item: str,
    amount_pkr: Decimal,
    merchant_display_name: str,
) -> dict[str, Any]:
    profile = MerchantProfile.objects.select_related("school").filter(user=merchant_user).first()
    if not profile:
        return {"ok": False, "message": "Merchant profile missing", "transaction": None}

    code = student_code.strip().upper()
    outlet = merchant_display_name.strip() or profile.outlet_name

    if not _validate_student_code(code):
        return {"ok": False, "message": "Invalid student ID", "transaction": None}

    student = (
        Student.objects.filter(school=profile.school, student_code=code)
        .select_related("wallet", "controls", "parent")
        .first()
    )

    def fail_no_student(reason: str) -> dict[str, Any]:
        return {"ok": False, "message": reason, "transaction": None}

    if not student:
        return fail_no_student("Student not found for this school")

    wallet = getattr(student, "wallet", None)
    if not wallet:
        return fail_no_student("Wallet not configured")
    balance = wallet.balance_pkr

    def record_fail(reason: str) -> dict[str, Any]:
        tx = TransactionRecord.objects.create(
            student=student,
            tx_type=TransactionRecord.TxType.PURCHASE,
            amount_pkr=amount_pkr,
            merchant_name=outlet,
            item_name=item.strip() or "—",
            status=TransactionRecord.Status.FAILED,
            failure_reason=reason,
            balance_after=balance,
            merchant_user=merchant_user,
        )
        return {
            "ok": False,
            "message": reason,
            "transaction": serialize_transaction(tx),
        }

    item_clean = item.strip()
    if not item_clean:
        return record_fail("Item name required")

    if amount_pkr <= 0:
        return record_fail("Invalid amount")

    controls = getattr(student, "controls", None)
    if controls and not controls.purchases_enabled:
        return record_fail("Payments disabled by parent")

    ds = get_or_create_daily_spend(student)
    if controls and controls.daily_limit_pkr > 0:
        if ds.spent_pkr + amount_pkr > controls.daily_limit_pkr:
            return record_fail("Daily limit exceeded")

    if amount_pkr > balance:
        return record_fail("Insufficient balance")

    with db_transaction.atomic():
        w = Wallet.objects.select_for_update().get(pk=wallet.pk)
        if amount_pkr > w.balance_pkr:
            return record_fail("Insufficient balance")

        ds_row = DailySpend.objects.select_for_update().filter(student=student, date=ds.date).get()
        if controls and controls.daily_limit_pkr > 0:
            if ds_row.spent_pkr + amount_pkr > controls.daily_limit_pkr:
                return record_fail("Daily limit exceeded")

        w.balance_pkr -= amount_pkr
        w.save(update_fields=["balance_pkr"])
        ds_row.spent_pkr += amount_pkr
        ds_row.save(update_fields=["spent_pkr"])

        tx = TransactionRecord.objects.create(
            student=student,
            tx_type=TransactionRecord.TxType.PURCHASE,
            amount_pkr=amount_pkr,
            merchant_name=outlet,
            item_name=item_clean,
            status=TransactionRecord.Status.SUCCESS,
            balance_after=w.balance_pkr,
            merchant_user=merchant_user,
        )

    _rapid_purchase_alert(student)

    return {
        "ok": True,
        "message": f"Payment approved – PKR {amount_pkr} deducted from student.",
        "transaction": serialize_transaction(tx),
    }


def create_photo_challenge(student: Student) -> dict[str, Any]:
    pool = list(
        Student.objects.filter(school=student.school)
        .exclude(pk=student.pk)
        .exclude(photo="")
        .values_list("pk", flat=True)[:50]
    )

    others = pool.copy()
    # Need 3 decoys; if not enough photos, repeat same-school students without photo requirement
    if len(others) < 3:
        extra = list(
            Student.objects.filter(school=student.school)
            .exclude(pk=student.pk)
            .values_list("pk", flat=True)[:20]
        )
        for e in extra:
            if e not in others:
                others.append(e)
            if len(others) >= 10:
                break

    random.shuffle(others)
    decoy_ids = others[:3]
    choice_ids = [student.pk] + decoy_ids
    while len(choice_ids) < 4:
        choice_ids.append(choice_ids[-1])
    random.shuffle(choice_ids)
    correct_index = choice_ids.index(student.pk)

    exp = timezone.now() + timedelta(minutes=5)
    sess = PhotoChallengeSession.objects.create(
        student=student,
        correct_index=correct_index,
        choice_student_ids=choice_ids,
        expires_at=exp,
    )

    photos = []
    for sid in choice_ids:
        stu = Student.objects.get(pk=sid)
        url = stu.photo.url if stu.photo else ""
        photos.append({"studentId": stu.student_code, "url": url, "placeholder": not bool(stu.photo)})

    return {"challenge_token": str(sess.token), "photos": photos, "expires_at": exp.isoformat()}


def verify_photo_challenge(token: str, selected_index: int, expected_student: Student) -> tuple[bool, str]:
    sess = PhotoChallengeSession.objects.filter(token=token, student=expected_student).first()
    if not sess:
        return False, "Invalid or expired challenge"
    if sess.verified:
        return False, "Challenge already used"
    if timezone.now() > sess.expires_at:
        return False, "Challenge expired"
    if selected_index == sess.correct_index:
        sess.verified = True
        sess.save(update_fields=["verified"])
        return True, "Verified"
    return False, "Wrong photo selected"


def apply_top_up(student: Student, amount_pkr: Decimal) -> TransactionRecord:
    if amount_pkr <= 0:
        raise ValueError("amount must be positive")
    with db_transaction.atomic():
        w = Wallet.objects.select_for_update().get(student=student)
        w.balance_pkr += amount_pkr
        w.save(update_fields=["balance_pkr"])
        return TransactionRecord.objects.create(
            student=student,
            tx_type=TransactionRecord.TxType.TOPUP,
            amount_pkr=amount_pkr,
            merchant_name="",
            item_name="Wallet top-up",
            status=TransactionRecord.Status.SUCCESS,
            balance_after=w.balance_pkr,
            merchant_user=None,
        )
