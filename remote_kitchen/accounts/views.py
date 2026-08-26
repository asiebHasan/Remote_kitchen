import json
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST, HTTP_409_CONFLICT
from rest_framework.views import APIView

from employees.models import Employee
from restaurants.models import Restaurant
from .models import CustomUser


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


def _user_payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_owner": user.is_owner,
        "is_employee": user.is_employee,
        "is_customer": user.is_customer,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "date_joined": user.date_joined.isoformat(),
        "token": token.key,
    }


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.META.get("CSRF_COOKIE") or request.COOKIES.get("csrftoken")
        return Response({"csrfToken": token})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_payload(request.user))


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Please fill in all fields"}, status=HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)

        if not user:
            return Response(
                {"error": "Invalid credentials, try again"}, status=HTTP_400_BAD_REQUEST
            )

        if not user.is_active:
            return Response(
                {"error": "Account is not active, please check your email"},
                status=HTTP_400_BAD_REQUEST,
            )

        login(request, user)
        return Response(_user_payload(user), status=HTTP_200_OK)


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        is_employee = request.data.get("is_employee") in (True, "true", "True")
        is_owner = request.data.get("is_owner") in (True, "true", "True")
        is_customer = request.data.get("is_customer") in (True, "true", "True")
        restaurant_id = request.data.get("restaurant_id")

        if not username or not email or not password:
            return Response(
                {"error": "Please fill in all fields"}, status=HTTP_400_BAD_REQUEST
            )

        if CustomUser.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already taken, choose another username"},
                status=HTTP_409_CONFLICT,
            )

        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already taken, choose another email"},
                status=HTTP_409_CONFLICT,
            )

        if len(password) < 6:
            return Response(
                {"error": "Password too short"}, status=HTTP_400_BAD_REQUEST
            )

        user = CustomUser.objects.create_user(username=username, email=email)
        user.set_password(password)

        if is_employee:
            if not restaurant_id:
                user.delete()
                return Response(
                    {"error": "Restaurant is required for employee accounts"},
                    status=HTTP_400_BAD_REQUEST,
                )
            try:
                restaurant = Restaurant.objects.get(id=restaurant_id)
            except Restaurant.DoesNotExist:
                user.delete()
                return Response(
                    {"error": "Selected restaurant does not exist"},
                    status=HTTP_400_BAD_REQUEST,
                )
            user.is_employee = True
            user.save()
            Employee.objects.create(employee=user, restaurant=restaurant)
        elif is_owner:
            user.is_owner = True
            user.save()
        else:
            # Default to a customer account when no explicit role is given.
            user.is_customer = True
            user.save()

        return Response({"status": "success", "user": _user_payload(user)})


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"status": "success"})
