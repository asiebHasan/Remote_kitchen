from django.urls import path
from . import views

urlpatterns = [
    path("", views.OrderView.as_view(), name="order-list"),
    path("<int:id>", views.SigleOrderView.as_view(), name="order-list"),
    path("api/order/", views.OrderListCreateView.as_view(), name="order-list-create"),
    path(
        "api/order/<int:pk>/",
        views.OrderRetrieveUpdateDestroyView.as_view(),
        name="order-retrieve-update-destroy",
    ),
]
