import os
from pathlib import Path
from decouple import config, Config, RepositoryEnv  # Import config and Config, RepositoryEnv from python-decouple

# Create a custom config that reads from .env file
config = Config(RepositoryEnv(os.path.join(Path(__file__).resolve().parent.parent, '.env')))

BASE_DIR = Path(__file__).resolve().parent.parent

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # for collecting static files in production

SECRET_KEY = 'autr)q0^dor8meur0pfa2e_3(qdy60yj3#j*$qn5j5hyf29piz'

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'car_parking_db',
        'USER': 'postgres',
        'PASSWORD': '123456',  # Change this to your PostgreSQL password
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# REQUIRED to fix admin + middleware errors
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',   # must be before AuthenticationMiddleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.ContentTypeMiddleware',  # Ensure proper charset in Content-Type headers
    'api.security_headers.SecurityHeadersMiddleware',  # Add security headers including charset
    # 'api.meta_middleware.HtmlMetaMiddleware',  # Add meta charset tag if missing (requires beautifulsoup4)
]

# REQUIRED to fix admin template error
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'api',  # my appname
    # 'background_task',  # Temporarily commented out due to compatibility issues
]

# TEMPORARY switch to default user to resolve migration order; will revert to 'api.User' after faking admin
AUTH_USER_MODEL = 'api.User'

# Custom authentication backend
AUTHENTICATION_BACKENDS = [
    'api.auth_backend.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'api.renderers.UTF8JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_CONTENT_NEGOTIATION_CLASS': 'api.content_negotiation.CustomContentNegotiation',
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser'
    ),
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'USER_ID_FIELD': 'id',  # Use standard ID field with PostgreSQL
    'USER_ID_CLAIM': 'user_id',  # Use standard user_id claim
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'AUTH_COOKIE': 'refresh_token',  # Cookie name for storing the refresh token
    'AUTH_COOKIE_SECURE': not DEBUG,  # Cookie will only be sent over HTTPS in production
    'AUTH_COOKIE_HTTP_ONLY': True,   # Prevents JavaScript from reading the cookie
    'AUTH_COOKIE_SAMESITE': 'Lax',   # Restricts cookie sharing with third-party sites
    'ROTATE_REFRESH_TOKENS': True,   # Generate new refresh token on refresh
}

# DEFAULT_AUTO_FIELD to fix warnings
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

ROOT_URLCONF = 'backend.urls'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
]
CORS_ALLOW_CREDENTIALS = True

# SMTP Email Configuration
# NOTE: Email sending is disabled. In-app notifications will be used instead.
# EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
# EMAIL_HOST = config('EMAIL_HOST', default='smtp.mailgun.org')
# EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
# EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
# EMAIL_HOST_USER = config('EMAIL_HOST_USER')
# EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
# DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='no-reply@parksystem.com')

# Previous Anymail settings (commented out, can be removed)
# ANYMAIL = {
#     "MAILGUN_API_KEY": config("MAILGUN_API_KEY"),
#     "MAILGUN_SENDER_DOMAIN": config("MAILGUN_SENDER_DOMAIN"),
# }

# Development settings
SKIP_EMAIL_VERIFICATION = DEBUG  # Skip email verification in development mode

# Cookie settings for development (DEBUG=True)
SESSION_COOKIE_SECURE = False  # Cookies will be sent over HTTP
CSRF_COOKIE_SECURE = False     # CSRF cookie sent over HTTP
SIMPLE_JWT['AUTH_COOKIE_SECURE'] = False  # JWT auth cookie sent over HTTP


