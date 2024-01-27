from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.Home.as_view(), name='restaurants'),
    path('<int:id>/', views.RestaurantView.as_view(), name = 'restaurant-view'),
    path('menus/', views.RestaurantMenusView.as_view(), name = 'restaurant-menus'),
    path('menus/<int:id>', views.RestaurantMenusEditView.as_view(), name = 'restaurant-menus'),
    
    path('api/restaurants/', views.RestaurantListCreateView.as_view(), name='restaurant-list'),
    path('api/create/', views.RestaurantListCreateView.as_view(), name='restaurant-list-create'),
    path('api/update/<int:pk>/', views.RestaurantRetrieveUpdateDestroyView.as_view(), name='restaurant-retrieve-update-destroy'),
    
    path('api/menus/', views.RestaurantMenuListCreateView.as_view(), name='menu-list'),
    path('api/menu/<int:pk>/', views.ReastaurantMenuRetriveUpdateDestryView.as_view(), name='menu-list'),
]
