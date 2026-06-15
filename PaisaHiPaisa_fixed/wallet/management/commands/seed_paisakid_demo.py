from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

from wallet.models import MerchantProfile, School, Student, Wallet


class Command(BaseCommand):
    help = "Create demo school, parent/merchant users, student S123, sample data, and print API tokens."

    def handle(self, *args, **options):
        school, _ = School.objects.get_or_create(slug="demo-school", defaults={"name": "Demo School"})

        parent, created = User.objects.get_or_create(
            username="parent",
            defaults={"email": "parent@paisakid.demo", "first_name": "Sarah"},
        )
        if created:
            parent.set_password("demo123")
            parent.save()

        merchant_user, mc = User.objects.get_or_create(
            username="merchant",
            defaults={"email": "merchant@paisakid.demo", "first_name": "Ahmed"},
        )
        if mc:
            merchant_user.set_password("demo123")
            merchant_user.save()

        MerchantProfile.objects.get_or_create(
            user=merchant_user,
            defaults={
                "display_name": "Ahmed",
                "outlet_name": "School Canteen",
                "school": school,
            },
        )

        student, sc = Student.objects.get_or_create(
            school=school,
            student_code="S123",
            defaults={
                "full_name": "Ali",
                "parent": parent,
            },
        )
        if not sc and student.parent_id != parent.id:
            student.parent = parent
            student.save(update_fields=["parent"])

        wallet, _ = Wallet.objects.get_or_create(student=student, defaults={"balance_pkr": Decimal("800.00")})
        wallet.balance_pkr = Decimal("800.00")
        wallet.save(update_fields=["balance_pkr"])

        ctr = student.controls
        ctr.daily_limit_pkr = Decimal("500.00")
        ctr.purchases_enabled = True
        ctr.save()

        for u in (parent, merchant_user):
            token, _ = Token.objects.get_or_create(user=u)

        self.stdout.write(self.style.SUCCESS("Demo data ready.\n"))
        self.stdout.write("Login: parent / demo123  |  merchant / demo123\n")
        self.stdout.write(f"Parent API token:   {Token.objects.get(user=parent).key}\n")
        self.stdout.write(f"Merchant API token: {Token.objects.get(user=merchant_user).key}\n")
        self.stdout.write('Set localStorage: localStorage.setItem("paisakid_token", "<token>")\n')
