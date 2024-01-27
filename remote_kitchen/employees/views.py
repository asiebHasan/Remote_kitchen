from django.shortcuts import render
from django.views import View
from rest_framework import generics, permissions

from restaurants.models import Restaurant

from .serializers import EmployeeSerializer
from .models import Employee


# Create your views here.
class EmployeelistView(View):
    def get(self, request):
        restaurants = Restaurant.objects.filter(owner=self.request.user)
        return render(request, "employees/index.html", {"restaurants": restaurants})


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get("id")
        if restaurant_id:
            return Employee.objects.filter(restaurant=restaurant_id)

    # def perform_create(self, serializer):
    #     serializer.save(owner=self.request.user)
