from rest_framework import generics, permissions

from .serializers import EmployeeSerializer
from .models import Employee


class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get("restaurant") or self.request.query_params.get("id")
        if restaurant_id:
            return Employee.objects.filter(restaurant_id=restaurant_id)
        return Employee.objects.none()
