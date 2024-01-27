from django.db import models
from accounts.models import CustomUser
from restaurants.models import Restaurant  # Make sure the import is correct

class Employee(models.Model):
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'is_employee': True})
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)

    def __str__(self):
        return self.employee.email
