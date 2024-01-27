from django.urls import path
from . import views


urlpatterns = [
    path("", views.EmployeelistView.as_view(), name="employee-list"),
    path("api/employee/", views.EmployeeListCreateView.as_view(), name='employee-list-create')
]
