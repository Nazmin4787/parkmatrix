from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.crypto import get_random_string

User = get_user_model()

@receiver(post_save, sender=User)
def create_email_verification_token(sender, instance=None, created=False, **kwargs):
    """
    When a new user is created, generate a verification token
    """
    if created and not instance.email_verification_token:
        # Generate a random token for email verification
        instance.email_verification_token = default_token_generator.make_token(instance)
        instance.save(update_fields=['email_verification_token'])
