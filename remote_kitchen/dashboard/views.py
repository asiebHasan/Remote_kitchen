from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from employees.models import Employee
from orders.models import Order
from restaurants.models import Restaurant, Menu


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        restaurant_ids = Restaurant.objects.filter(owner=user).values_list(
            "id", flat=True
        )
        menus = Menu.objects.filter(restaurant_id__in=restaurant_ids)
        orders = Order.objects.filter(restaurant_id__in=restaurant_ids)
        employees = Employee.objects.filter(restaurant_id__in=restaurant_ids)
        paid_orders = orders.filter(payment_status=True)
        revenue = paid_orders.aggregate(total=Sum("total_price"))["total"] or 0

        recent_orders = orders.order_by("-created_at")[:5]

        stats = {
            "restaurants": Restaurant.objects.filter(owner=user).count(),
            "menus": menus.count(),
            "orders": orders.count(),
            "employees": employees.count(),
            "revenue": str(revenue),
            "pending_orders": orders.filter(payment_status=False).count(),
            "recent_orders": [
                {
                    "id": o.id,
                    "user_email": o.user.email,
                    "restaurant_name": o.restaurant.name,
                    "total_price": str(o.total_price),
                    "payment_status": o.payment_status,
                    "status": o.status,
                    "item_count": o.ordered_items.count(),
                    "created_at": o.created_at.isoformat(),
                }
                for o in recent_orders
            ],
        }
        return Response(stats)
