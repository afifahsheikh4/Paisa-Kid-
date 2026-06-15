from django.urls import path
from . import views

app_name = "wallet"

urlpatterns = [
    path("", views.home_page, name="home"),
    path("login/", views.login_page, name="login"),
    path("signup/", views.signup_page, name="signup"),
    path("logout/", views.logout_view, name="logout"),
    path("parent/dashboard/", views.parent_dashboard, name="parent_dashboard"),
    path("merchant/dashboard/", views.merchant_dashboard, name="merchant_dashboard"),
]
