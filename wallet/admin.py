from django.contrib import admin

from .models import (
    DailySpend,
    MerchantProfile,
    ParentAlert,
    PhotoChallengeSession,
    School,
    Student,
    StudentControls,
    TransactionRecord,
    Wallet,
)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(MerchantProfile)
class MerchantProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "outlet_name", "school", "user")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_code", "full_name", "school", "parent")
    list_filter = ("school",)
    search_fields = ("student_code", "full_name", "parent__username")


@admin.register(TransactionRecord)
class TransactionRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "tx_type", "amount_pkr", "status", "merchant_name", "created_at")
    list_filter = ("tx_type", "status", "created_at")
    search_fields = ("student__student_code", "item_name")


@admin.register(ParentAlert)
class ParentAlertAdmin(admin.ModelAdmin):
    list_display = ("message", "severity", "parent", "student", "created_at")


@admin.register(DailySpend)
class DailySpendAdmin(admin.ModelAdmin):
    list_display = ("student", "date", "spent_pkr")


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("student", "balance_pkr")


@admin.register(StudentControls)
class StudentControlsAdmin(admin.ModelAdmin):
    list_display = ("student", "daily_limit_pkr", "purchases_enabled")


admin.site.register(PhotoChallengeSession)
