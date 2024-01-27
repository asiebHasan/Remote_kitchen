from django.shortcuts import redirect, render
from django.views import View
import json
from django.http import JsonResponse

# Create your views here.


class Home(View):
    def get(self, request):
        return render(request, "dashboard/index.html")
