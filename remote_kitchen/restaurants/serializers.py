from rest_framework import serializers
from .models import Restaurant, Menu


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ["id", "name", "address", "owner", "created_at"]
        read_only_fields = ["owner", "created_at"]


class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menu
        fields = ["id", "restaurant", "name", "description","price","is_available","is_vegetarian"]
        read_only_fields = [
            "restaurant",
        ]
