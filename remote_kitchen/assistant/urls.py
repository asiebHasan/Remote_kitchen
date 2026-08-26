from django.urls import path
from . import views

urlpatterns = [
    path("assistant/", views.AssistantQueryView.as_view(), name="assistant-query"),
]
