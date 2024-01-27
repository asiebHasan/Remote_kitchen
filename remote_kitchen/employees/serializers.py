from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    employee__username = serializers.EmailField(source="employee.username", read_only=True)
    employee__email = serializers.EmailField(source='employee.email', read_only=True)
    employee__date_joined = serializers.EmailField(source='employee.date_joined', read_only=True)
    restaurant__name = serializers.CharField(source="restaurant.name", read_only=True)

    class Meta:
        model = Employee
        fields = ['employee__username','employee__email','employee__date_joined', 'restaurant__name']
