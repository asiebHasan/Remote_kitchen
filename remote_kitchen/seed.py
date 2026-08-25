import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "remote_kitchen.settings")
django.setup()

from accounts.models import CustomUser
from employees.models import Employee
from orders.models import Order, OrderedItem
from restaurants.models import Restaurant, Menu


def seed():
    owner, created = CustomUser.objects.get_or_create(
        username="owner",
        defaults={
            "email": "owner@kitchen.io",
            "is_owner": True,
        },
    )
    if created:
        owner.set_password("ownerpass123")
        owner.save()
        print("Created owner account: owner / ownerpass123")
    else:
        print("Owner account already exists")

    employee_user, created = CustomUser.objects.get_or_create(
        username="chef",
        defaults={
            "email": "chef@kitchen.io",
            "is_employee": True,
        },
    )
    if created:
        employee_user.set_password("chefpass123")
        employee_user.save()

    restos = [
        {"name": "The Golden Fork", "address": "12 Elm Street, Springfield"},
        {"name": "Saffron & Spice", "address": "88 Curry Lane, Springfield"},
        {"name": "Harbor Grill", "address": "3 Pier Road, Bayview"},
    ]
    restaurants = []
    for r in restos:
        resto, _ = Restaurant.objects.get_or_create(
            name=r["name"], address=r["address"], owner=owner
        )
        restaurants.append(resto)

    menus_data = [
        ("The Golden Fork", "Margherita Pizza", "Classic tomato, mozzarella, basil", 12.50, True, True),
        ("The Golden Fork", "Truffle Pasta", "Creamy truffle sauce with parmesan", 18.00, True, False),
        ("The Golden Fork", "Grilled Salmon", "Chargrilled salmon with lemon butter", 24.00, True, False),
        ("Saffron & Spice", "Butter Chicken", "Slow cooked in creamy tomato sauce", 16.50, True, False),
        ("Saffron & Spice", "Paneer Tikka", "Marinated cottage cheese, grilled", 13.00, True, True),
        ("Saffron & Spice", "Veg Biryani", "Fragrant rice with garden vegetables", 14.00, True, True),
        ("Harbor Grill", "Seafood Platter", "Mixed grilled seafood of the day", 32.00, True, False),
        ("Harbor Grill", "Clam Chowder", "New England style creamy chowder", 9.00, False, False),
        ("Harbor Grill", "Caesar Salad", "Crisp romaine, parmesan, croutons", 10.50, True, True),
    ]
    menus = {}
    for rname, name, desc, price, avail, veg in menus_data:
        resto = next(r for r in restaurants if r.name == rname)
        menu, _ = Menu.objects.get_or_create(
            restaurant=resto,
            name=name,
            defaults={
                "description": desc,
                "price": price,
                "is_available": avail,
                "is_vegetarian": veg,
            },
        )
        menus[name] = menu

    if not Employee.objects.filter(employee=employee_user).exists():
        Employee.objects.create(employee=employee_user, restaurant=restaurants[0])
        print("Created employee account: chef / chefpass123")

    if Order.objects.count() == 0:
        sample_orders = [
            (restaurants[0], [("Margherita Pizza", 2), ("Grilled Salmon", 1)], True, "delivered"),
            (restaurants[0], [("Truffle Pasta", 1)], False, "preparing"),
            (restaurants[1], [("Butter Chicken", 2), ("Veg Biryani", 1)], True, "ready"),
            (restaurants[2], [("Clam Chowder", 1)], False, "pending"),
        ]
        for resto, items, paid, status_label in sample_orders:
            total = sum(menus[n].price * q for n, q in items)
            order = Order.objects.create(
                user=employee_user,
                restaurant=resto,
                total_price=total,
                payment_status=paid,
                status=status_label,
            )
            for n, q in items:
                OrderedItem.objects.create(
                    order=order, menu=menus[n], quantity=q, subtotal=menus[n].price * q
                )
        print("Created sample orders")

    print("Seed complete.")
    print("Login as owner/ownerpass123 to manage restaurants, menus, employees, and orders.")


if __name__ == "__main__":
    seed()
