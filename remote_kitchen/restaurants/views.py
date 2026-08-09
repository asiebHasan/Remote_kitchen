from django.db.models import Count, Q
from rest_framework import generics, permissions

from .models import Restaurant, Menu
from .serializers import RestaurantSerializer, MenuSerializer, PublicRestaurantSerializer
from .permissions import IsOwnerOrReadOnly


class PublicRestaurantListView(generics.ListAPIView):
    serializer_class = PublicRestaurantSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Restaurant.objects.annotate(
            menu_count=Count("menus", filter=Q(menus__is_available=True))
        )


class PublicRestaurantDetailView(generics.RetrieveAPIView):
    serializer_class = PublicRestaurantSerializer
    permission_classes = [permissions.AllowAny]
    lookup_url_kwarg = "pk"

    def get_queryset(self):
        return Restaurant.objects.annotate(
            menu_count=Count("menus", filter=Q(menus__is_available=True))
        )


class PublicRestaurantMenusView(generics.ListAPIView):
    serializer_class = MenuSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Menu.objects.filter(
            restaurant_id=self.kwargs["pk"], is_available=True
        )


class RestaurantListCreateView(generics.ListCreateAPIView):
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Restaurant.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class RestaurantRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RestaurantSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return Restaurant.objects.filter(owner=self.request.user)


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
        serializer.save(restaurant_id=self.request.data.get("restaurant"))


class ReastaurantMenuRetriveUpdateDestryView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [permissions.IsAuthenticated]
