from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),       # Admin panel access
    path('api/', include('api.urls')),     # Includes all URLs defined in your `api` app
]



