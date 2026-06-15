from django import forms
from django.contrib.auth.models import User


class LoginForm(forms.Form):
    username = forms.CharField(max_length=150, label="Username")
    password = forms.CharField(widget=forms.PasswordInput, label="Password")


class SignupForm(forms.Form):
    role = forms.ChoiceField(
        choices=[("parent", "Parent"), ("merchant", "Merchant")],
        widget=forms.RadioSelect,
        initial="parent",
        label="Account type",
    )
    username = forms.CharField(max_length=150, label="Username")
    password1 = forms.CharField(widget=forms.PasswordInput, label="Password")
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirm password")
    display_name = forms.CharField(
        max_length=120,
        required=False,
        label="Merchant display name",
        help_text="Required only for merchant accounts.",
    )
    outlet_name = forms.CharField(
        max_length=200,
        required=False,
        label="Outlet name",
        help_text="Optional merchant outlet name.",
    )

    def clean_username(self):
        username = self.cleaned_data["username"].strip()
        if User.objects.filter(username__iexact=username).exists():
            raise forms.ValidationError("A user with that username already exists.")
        return username

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("password1") != cleaned.get("password2"):
            raise forms.ValidationError("Passwords do not match.")
        if cleaned.get("role") == "merchant" and not cleaned.get("display_name"):
            self.add_error("display_name", "Merchant display name is required.")
        return cleaned
