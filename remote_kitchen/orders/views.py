from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Order
from employees.models import Employee
from restaurants.models import Restaurant
from .serializers import OrderSerializer, OrderCreateSerializer


def managed_restaurant_ids(user):
    """Return ids of restaurants the user owns or works for."""
    owned = Restaurant.objects.filter(owner=user).values_list("id", flat=True)
    employed = Employee.objects.filter(employee=user).values_list(
        "restaurant_id", flat=True
    )
    return set(owned) | set(employed)


def manages_restaurant(user, restaurant):
    """True when the user owns the restaurant or is an employee there."""
    if restaurant.owner_id == user.id:
        return True
    return Employee.objects.filter(employee=user, restaurant=restaurant).exists()


class OrderListCreateView(generics.ListCreateAPIView):
    """GET lists orders for the owner's/employee's restaurants; POST creates a customer order."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get("restaurant")

        if restaurant_id:
            if int(restaurant_id) not in managed_restaurant_ids(self.request.user):
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
        return Order.objects.filter(
            Q(restaurant_id__in=managed_restaurant_ids(self.request.user))
            | Q(user=self.request.user)
        )

    def update(self, request, *args, **kwargs):
        if "status" in request.data:
            order = self.get_object()
            if not manages_restaurant(request.user, order.restaurant):
                return Response(
                    {
                        "detail": "Only the restaurant owner or an employee can update the order status."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().update(request, *args, **kwargs)
