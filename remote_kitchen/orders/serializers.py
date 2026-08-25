from decimal import Decimal

from django.shortcuts import get_object_or_404
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
            "status",
            "total_price",
            "created_at",
        ]
        read_only_fields = ["payment_status"]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(write_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "restaurant",
            "ordered_items",
            "payment_status",
            "total_price",
            "created_at",
            "items",
        ]
        read_only_fields = [
            "id",
            "ordered_items",
            "payment_status",
            "total_price",
            "created_at",
        ]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "Order must contain at least one item."
            )
        cleaned = []
        for item in value:
            menu_id = item.get("menu")
            quantity = item.get("quantity")
            if not menu_id or not quantity:
                raise serializers.ValidationError(
                    "Each item must include a menu id and quantity."
                )
            try:
                quantity = int(quantity)
            except (TypeError, ValueError):
                raise serializers.ValidationError("Quantity must be a number.")
            if quantity < 1:
                raise serializers.ValidationError("Quantity must be at least 1.")
            cleaned.append({"menu": int(menu_id), "quantity": quantity})
        return cleaned

    def create(self, validated_data):
        items = validated_data.pop("items")
        restaurant = validated_data["restaurant"]
        user = self.context["request"].user

        order = Order.objects.create(
            user=user,
            restaurant=restaurant,
            total_price=Decimal("0.00"),
            payment_status=False,
        )
        total = Decimal("0.00")
        for item in items:
            menu = get_object_or_404(
                Menu, id=item["menu"], restaurant=restaurant
            )
            quantity = item["quantity"]
            subtotal = menu.price * quantity
            OrderedItem.objects.create(
                order=order, menu=menu, quantity=quantity, subtotal=subtotal
            )
            total += subtotal
        order.total_price = total
        order.save()
        return order
