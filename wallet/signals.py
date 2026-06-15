from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Student, StudentControls, Wallet


@receiver(post_save, sender=Student)
def ensure_wallet_and_controls(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.get_or_create(student=instance, defaults={"balance_pkr": 0})
        StudentControls.objects.get_or_create(student=instance)
