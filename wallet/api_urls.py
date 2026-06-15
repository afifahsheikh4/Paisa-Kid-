from django.urls import path
from . import views

urlpatterns = [
    path("auth/login/", views.login_api),
    path("auth/signup/", views.signup_api),
    path("parent/state/", views.parent_state_api),
    path("parent/topup/", views.parent_top_up_api),
    path("parent/controls/", views.parent_controls_api),
    path("parent/reset-day/", views.parent_reset_day_api),
    path("parent/dispute/<uuid:tx_id>/", views.parent_dispute_api),
    path("merchant/state/", views.merchant_state_api),
    path("merchant/pay/", views.merchant_payment_api),       # used by dashboard
    path("merchant/payment/", views.merchant_payment_api),   # REST alias
    path("students/<str:student_code>/photo-challenge/", views.photo_challenge_api),
    path("students/<str:student_code>/photo-verify/", views.photo_verify_api),
    path("students/<str:student_code>/", views.student_lookup_api),
]
