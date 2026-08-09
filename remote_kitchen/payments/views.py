from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
import braintree

gateway = braintree.BraintreeGateway(settings.BRAINTREE_CONF)


class ClientTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = gateway.client_token.generate()
        return Response({"client_token": token})


class PaymentProcessAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        order_id = request.data.get("order_id")
        order = get_object_or_404(
            Order, id=order_id, restaurant__owner=request.user
        )
        total_cost = order.total_price

        nonce = self.request.data.get("payment_method_nonce", None)

        result = gateway.transaction.sale(
            {
                "amount": f"{float(total_cost):.2f}",
                "payment_method_nonce": nonce,
                "options": {"submit_for_settlement": True},
            }
        )

        if result.is_success:
            order.payment_status = True
            order.save()
            return Response(
                {
                    "message": "Payment successful",
                    "transaction_id": result.transaction.id,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"message": "Payment failed", "result": result.message},
            status=status.HTTP_400_BAD_REQUEST,
        )
