from django.urls import path
from . import views

app_name = "payment"

urlpatterns = [
    path("process/", views.payment_process.as_view(), name="process"),
    path("api/process/", views.PaymentProcessAPIView.as_view(), name="process-api"),
    path("done/", views.payment_done.as_view(), name="done"),
    path("canceled/", views.payment_canceled.as_view(), name="canceled"),
]
