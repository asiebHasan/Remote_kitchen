from django.contrib import admin
from .models import Order, OrderedItem

# Register your models here.
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['user','restaurant','total_price','created_at']

@admin.register(OrderedItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu', 'quantity', 'subtotal']