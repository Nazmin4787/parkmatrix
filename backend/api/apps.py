from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """Called when Django starts - initialize scheduler here"""
        import api.signals
        
        # Start APScheduler for background tasks
        import sys
        
        # Only start scheduler in main process (not during migrations, tests, etc.)
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv[0]:
            from .scheduler import start_scheduler
            try:
                start_scheduler()
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to start scheduler: {e}")
