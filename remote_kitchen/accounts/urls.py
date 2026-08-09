from django.urls import path
from . import views
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path("csrf/", views.CsrfTokenView.as_view(), name="api-csrf"),
    path("me/", views.MeView.as_view(), name="api-me"),
    path("login/", views.LoginAPIView.as_view(), name="api-login"),
    path("register/", views.RegisterAPIView.as_view(), name="api-register"),
    path("logout/", views.LogoutAPIView.as_view(), name="api-logout"),
    path(
        "validate-username/",
        csrf_exempt(views.UsernameValidationView.as_view()),
        name="username-validation",
    ),
    path(
        "validate-email/",
        csrf_exempt(views.EmailValidationView.as_view()),
        name="email-validation",
    ),
]
