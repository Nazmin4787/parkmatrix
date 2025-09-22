from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomAccessToken(AccessToken):
    def __init__(self, user=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if user:
            self['user_id'] = user.id
            self['username'] = user.username
            self['email'] = user.email
            self['role'] = user.role

class CustomRefreshToken(RefreshToken):
    access_token_class = CustomAccessToken
    
    @classmethod
    def for_user(cls, user):
        # Use the parent's for_user method but then override the user_id
        token = super().for_user(user)
        # Override the user_id that gets set to None
        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        return token
