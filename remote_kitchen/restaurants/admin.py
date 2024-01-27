from django.contrib import admin
from .models import Restaurant, Menu

# Register your models here.


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ["owner", "name", "address"]


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ["restaurant", "name", "description"]


