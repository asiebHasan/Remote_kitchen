from django.shortcuts import render, redirect
from django.views import View
import json
from django.http import JsonResponse
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from .models import CustomUser
from restaurants.models import Restaurant
from employees.models import Employee

class UsernameValidationView(View):
    def post(self, request):
        data = json.loads(request.body)
        username = data.get("username")

        if not str(username).isalnum():
            return JsonResponse(
                {
                    "username_error": "Username should only contain alphanumeric characters"
                },
                status=400,
            )
        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse(
                {"username_error": "Username already taken, choose another username"},
                status=409,
            )
        return JsonResponse({"username_valid": True})


class EmailValidationView(View):
    def post(self, request):
        data = json.loads(request.body)
        email = data.get("email")

        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse(
                {"email_error": "Enter a valid email"},
                status=400,
            )
        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse(
                {"email_error": "Email already taken, choose another email"},
                status=409,
            )
        return JsonResponse({"email_valid": True})


class RegistrationView(View):
    def get(self, request):
        return render(request, "accounts/register.html")

    def post(self, request):
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")

        is_employee = request.POST.get("is_employee") == "true"
        restaurant_id = request.POST.get('restaurant_id')
        
        context = {"fieldValue": request.POST}

        if not CustomUser.objects.filter(username=username).exists():
            if not CustomUser.objects.filter(email=email).exists():
                if len(password) < 6:
                    messages.error(request, "Password too short")
                    return render(request, "accounts/register.html", context)

                user = CustomUser.objects.create_user(username=username, email=email)

                if is_employee:
                    user.is_employee = True
                    user.set_password(password)
                    user.save()
                    
                    Employee.objects.create(employee=user, restaurant=Restaurant.objects.get(id=restaurant_id)).save()
                    
                else:
                    user.is_owner = True
                    user.set_password(password)
                    user.save()
                

                messages.success(
                    request,
                    "Account successfully created",
                )

                return JsonResponse({"status": "success"})

        messages.error(request, "Invalid Username/email")
        return JsonResponse({"status": "error"})


class LoginView(View):
    def get(self, request):
        return render(request, "accounts/login.html")

    def post(self, request):
        username = request.POST.get("username")
        password = request.POST.get("password")

        if username and password:
            user = authenticate(request, username=username, password=password)

            if user:
                if user.is_active:
                    login(request, user)
                    messages.success(
                        request,
                        f"Welcome, {user.get_username()}! You are now logged in",
                    )
                    return redirect("home")
                else:
                    messages.error(
                        request, "Account is not active, please check your email"
                    )
                    return render(request, "accounts/login.html")
            else:
                messages.error(request, "Invalid credentials, try again")
                return render(request, "accounts/login.html")

        messages.error(request, "Please fill in all fields")
        return render(request, "accounts/login.html")


class LogoutView(View):
    def get(self, request):
        logout(request)
        messages.success(request, "You have been logged out")
        print("logged out")
        return redirect("login")
