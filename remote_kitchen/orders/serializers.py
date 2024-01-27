from rest_framework import serializers
from restaurants.models import Menu
from .models import Order, OrderedItem
from restaurants.serializers import MenuSerializer


# serializers.py


class OrderedItemSerializer(serializers.ModelSerializer):
    menu = MenuSerializer()

    class Meta:
        model = OrderedItem
        fields = ["id", "menu", "quantity", "subtotal"]


class OrderSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
    ordered_items = OrderedItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user_email",
            "restaurant",
            "restaurant_name",
            "ordered_items",
            "payment_status",
            "total_price",
            "created_at",
        ]
