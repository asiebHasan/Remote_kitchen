from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from orders.serializers import OrderSerializer
from orders.models import Order
import braintree

gateway = braintree.BraintreeGateway(settings.BRAINTREE_CONF)


class PaymentProcessAPIView(APIView):
    def post(self, request, *args, **kwargs):
        order_id = request.data.get("order_id")
        order = get_object_or_404(Order, id=order_id)
        total_cost = order.total_cost

        # retrieve nonce
        nonce = self.request.data.get("payment_method_nonce", None)

        # create and submit transaction
        result = gateway.transaction.sale(
            {
                "amount": f"{total_cost:.2f}",
                "payment_method_nonce": nonce,
                "options": {"submit_for_settlement": True},
            }
        )

        if result.is_success:
            # mark the order as paid
            order.paid = True
            # store the unique transaction id
            order.braintree_id = result.transaction.id
            order.save()

            return Response(
                {"message": "Payment successful"}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"message": "Payment failed", "result": result.message},
                status=status.HTTP_400_BAD_REQUEST,
            )


class payment_process(View):
    def get(request):
        return render(request, "payment/process.html")

class payment_done(View):
    def get(request):
        return render(request, "payment/done.html")


class payment_canceled(View):
    def get(request):
        return render(request, "payment/canceled.html")
