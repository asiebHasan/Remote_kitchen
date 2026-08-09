from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="employee.username", read_only=True)
    email = serializers.EmailField(source="employee.email", read_only=True)
    date_joined = serializers.DateTimeField(source="employee.date_joined", read_only=True)
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
    employee_id = serializers.IntegerField(source="employee.id", read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "username",
            "email",
            "date_joined",
            "restaurant",
            "restaurant_name",
        ]
        read_only_fields = [
            "id",
            "employee_id",
            "username",
            "email",
            "date_joined",
            "restaurant_name",
        ]
