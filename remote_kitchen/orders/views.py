from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Order
from restaurants.models import Restaurant
from .serializers import OrderSerializer, OrderCreateSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    """GET lists orders for the owner's restaurant; POST creates a customer order."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get("restaurant")

        if restaurant_id:
            owned = Restaurant.objects.filter(owner=self.request.user).values_list(
                "id", flat=True
            )
            if int(restaurant_id) not in owned:
                return Order.objects.none()
            return Order.objects.filter(restaurant_id=restaurant_id)
        return Order.objects.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            OrderSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class CustomerOrderListView(generics.ListAPIView):
    """Returns the current customer's own orders."""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")


class OrderRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        owned = Restaurant.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        return Order.objects.filter(Q(restaurant_id__in=owned) | Q(user=self.request.user))
