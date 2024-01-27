from django.shortcuts import render
from django.views import View
from rest_framework import generics, permissions

from .models import Order
from restaurants.models import Restaurant
from .serializers import OrderSerializer

# Create your views here.


class OrderView(View):
    def get(self, request):
        restaurants = Restaurant.objects.filter(owner=self.request.user)
        return render(request, "orders/list.html", {"restaurants": restaurants})
    
class SigleOrderView(View):
    def get(self, request, id):
        order = Order.objects.get(id=id)
        return render(request, "orders/details.html", {"order": order})


class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get("restaurant")

        if restaurant_id:
            orders = Order.objects.filter(restaurant_id=restaurant_id)
            print(orders)
            return orders
        else:
            return Order.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
