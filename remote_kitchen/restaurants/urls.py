from django.urls import path
from . import views

urlpatterns = [
    path(
        "public/restaurants/",
        views.PublicRestaurantListView.as_view(),
        name="public-restaurant-list",
    ),
    path(
        "public/restaurants/<int:pk>/",
        views.PublicRestaurantDetailView.as_view(),
        name="public-restaurant-detail",
    ),
    path(
        "public/restaurants/<int:pk>/menus/",
        views.PublicRestaurantMenusView.as_view(),
        name="public-restaurant-menus",
    ),
    path(
        "restaurants/",
        views.RestaurantListCreateView.as_view(),
        name="restaurant-list-create",
    ),
    path(
        "restaurants/<int:pk>/",
        views.RestaurantRetrieveUpdateDestroyView.as_view(),
        name="restaurant-detail",
    ),
    path("menus/", views.RestaurantMenuListCreateView.as_view(), name="menu-list"),
    path(
        "menus/<int:pk>/",
        views.ReastaurantMenuRetriveUpdateDestryView.as_view(),
        name="menu-detail",
    ),
]
