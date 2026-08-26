from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from accounts.models import CustomUser
from orders.models import Order, OrderedItem
from restaurants.models import Menu, Restaurant


class AssistantQueryViewTests(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username="owner", email="owner@kitchen.io", password="pass123", is_owner=True
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name="The Golden Fork",
            address="12 Elm Street, Springfield",
            latitude=39.7817,
            longitude=-89.6501,
        )
        self.pizza = Menu.objects.create(
            restaurant=self.restaurant,
            name="Margherita Pizza",
            description="Classic tomato, mozzarella, basil",
            price=Decimal("12.50"),
            is_vegetarian=True,
        )
        Menu.objects.create(
            restaurant=self.restaurant,
            name="Grilled Salmon",
            description="Chargrilled salmon with lemon butter",
            price=Decimal("24.00"),
            is_vegetarian=False,
        )

    def _ask(self, q, **extra):
        return self.client.post(
            reverse("assistant-query"),
            {"q": q, **extra},
            content_type="application/json",
        )

    def test_matches_dish_name(self):
        resp = self._ask("pizza")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["name"], "Margherita Pizza")
        self.assertEqual(data["items"][0]["restaurant_name"], "The Golden Fork")

    def test_vegetarian_filter(self):
        resp = self._ask("I want something vegetarian")
        data = resp.json()
        self.assertEqual(len(data["items"]), 1)
        self.assertTrue(all(i["is_vegetarian"] for i in data["items"]))

    def test_price_filter(self):
        resp = self._ask("what's under $15?")
        data = resp.json()
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["price"], "12.50")

    def test_closest_requires_location(self):
        resp = self._ask("closest restaurant with pasta")
        data = resp.json()
        self.assertTrue(data["needs_location"])

    def test_closest_sorts_by_distance(self):
        resp = self._ask(
            "closest restaurant with pizza", lat=39.78, lng=-89.65
        )
        data = resp.json()
        self.assertEqual(len(data["items"]), 1)
        self.assertIsNotNone(data["items"][0]["distance_km"])

    def test_no_match_returns_helpful_message(self):
        resp = self._ask("dragonfruit smoothie")
        data = resp.json()
        self.assertEqual(data["items"], [])
        self.assertIn("couldn't find", data["message"])
