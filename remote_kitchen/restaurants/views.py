from django.shortcuts import render, redirect
from django.views import View
from rest_framework import generics, permissions
from .models import Restaurant, Menu
from .serializers import RestaurantSerializer, MenuSerializer
from .permissions import IsOwnerOrReadOnly


# Create your views here.
class Home(View):
    def get(self, request):
        return render(request, "restaurants/index.html")


class RestaurantView(View):
    def get(self, request, id):
        restaurant = Restaurant.objects.get(id=id)
        return render(request, "restaurants/edit.html", {"restaurant": restaurant})


class RestaurantMenusView(View):
    def get(self, request):
        restaurants = Restaurant.objects.filter(owner=self.request.user)
        return render(
            request, "restaurants/menus/index.html", {"restaurants": restaurants}
        )
class RestaurantMenusEditView(View):
    def get(self, request,id):
        menu = Menu.objects.get(id=id)
        return render(
            request, "restaurants/menus/edit.html", {"menu": menu}
        )


class RestaurantListCreateView(generics.ListCreateAPIView):
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Restaurant.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class RestaurantRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsOwnerOrReadOnly]


class RestaurantMenuListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get("restaurant")

        if restaurant_id:
            return Menu.objects.filter(restaurant_id=restaurant_id)
        else:
            return Menu.objects.none()

    def perform_create(self, serializer):
        # Associate the menu with the authenticated user and the selected restaurant
        serializer.save(
           restaurant_id=self.request.data.get("restaurant")
        )


class ReastaurantMenuRetriveUpdateDestryView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    