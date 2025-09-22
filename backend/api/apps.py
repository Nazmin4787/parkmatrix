from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals
        # We've moved task scheduling to a separate management command
        # to completely avoid database access during app initialization
        pass
