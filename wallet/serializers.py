from decimal import Decimal

from rest_framework import serializers

from .models import ParentAlert, TransactionRecord


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)
    role = serializers.ChoiceField(choices=["parent", "merchant"], default="parent")
    display_name = serializers.CharField(required=False, allow_blank=True)
    outlet_name = serializers.CharField(required=False, allow_blank=True)


class TopUpSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))


class ParentControlsSerializer(serializers.Serializer):
    daily_limit_pkr = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal("0"), max_value=Decimal("2000"), required=False
    )
    purchases_enabled = serializers.BooleanField(required=False)


class MerchantPaymentSerializer(serializers.Serializer):
    student_id = serializers.CharField(max_length=20)
    item = serializers.CharField(max_length=200)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    merchant = serializers.CharField(max_length=200, required=False, allow_blank=True)


class PhotoVerifySerializer(serializers.Serializer):
    challenge_token = serializers.UUIDField()
    selected_index = serializers.IntegerField(min_value=0, max_value=3)


def serialize_transaction(tx: TransactionRecord) -> dict:
    st = TransactionRecord.Status
    status_map = {st.SUCCESS: "Success", st.FAILED: "Failed", st.FLAGGED: "Flagged"}
    amt = tx.amount_pkr
    out_amt = int(amt) if amt == int(amt) else float(amt)
    return {
        "id": str(tx.id),
        "studentId": tx.student.student_code,
        "merchant": tx.merchant_name,
        "item": tx.item_name,
        "amount": out_amt,
        "timestamp": int(tx.created_at.timestamp() * 1000),
        "status": status_map.get(tx.status, "Success"),
        "failureReason": tx.failure_reason or None,
    }


def serialize_alert(a: ParentAlert) -> dict:
    return {
        "id": str(a.id),
        "message": a.message,
        "timestamp": int(a.created_at.timestamp() * 1000),
        "severity": a.severity,
    }
