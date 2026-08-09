from django.urls import path
from . import views

urlpatterns = [
    path("payment/token/", views.ClientTokenView.as_view(), name="client-token"),
    path("payment/process/", views.PaymentProcessAPIView.as_view(), name="process-api"),
]
