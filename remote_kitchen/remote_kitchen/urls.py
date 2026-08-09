"""
URL configuration for remote_kitchen project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/", include("restaurants.urls")),
    path("api/", include("employees.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("payments.urls")),
]
