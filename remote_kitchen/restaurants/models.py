from django.db import models
from django.contrib.auth import get_user_model

# Create your models here.

User = get_user_model()


class Restaurant(models.Model):
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_restaurants"
    )
    name = models.CharField(max_length=255)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Menu(models.Model):
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name="menus"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    is_vegetarian = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

