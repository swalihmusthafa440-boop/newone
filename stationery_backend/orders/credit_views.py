
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomerCreditPermission
from django.db.models import Q

from .models import (
    Order,
    DeliveryCashHandover,
    CustomerCredit,
    CustomerCreditPayment,
)
from .credit_serializers import (
    DeliveryCashHandoverSerializer,
    CustomerCreditSerializer,
    CustomerCreditPaymentSerializer,
)


def staff_order_queryset(user):
    orders = Order.objects.select_related(
        'user', 'address', 'store'
    )

    if user.is_superuser:
        return orders

    # Store staff should only access orders belonging to their store.
    try:
        from auth_api.store_permissions import get_owned_store
        store = get_owned_store(user)
    except Exception:
        store = None

    if store is not None:
        return orders.filter(store=store)

    return orders.none()


class DeliveryCashHandoverView(APIView):
    permission_classes = [IsAuthenticated]

    def get_order(self, request, order_id):
        if not request.user.is_staff:
            return None
        return get_object_or_404(
            staff_order_queryset(request.user),
            pk=order_id
        )

    def get(self, request, order_id):
        order = self.get_order(request, order_id)
        if order is None:
            return Response(
                {'detail': 'Administrator access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        handover = DeliveryCashHandover.objects.filter(
            order=order
        ).first()

        if not handover:
            return Response(
                {'detail': 'No handover saved yet.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(DeliveryCashHandoverSerializer(handover).data)

    
    def post(self, request, order_id):
        if not request.user.is_staff:
            return Response(
                {'detail': 'Administrator access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        order = get_object_or_404(
            staff_order_queryset(request.user),
            pk=order_id
        )

        existing = DeliveryCashHandover.objects.filter(
            order=order
        ).first()

        serializer = DeliveryCashHandoverSerializer(
            existing,
            data=request.data,
            partial=bool(existing)
        )
        serializer.is_valid(raise_exception=True)

        handed_over = Decimal(str(
            serializer.validated_data.get(
                'amount_handed_over',
                existing.amount_handed_over if existing else 0
            )
        ))

        total_amount = Decimal(str(
            serializer.validated_data.get(
                'total_amount',
                existing.total_amount if existing else order.total_amount
            )
        ))

        remaining = total_amount - handed_over

        if remaining > 0:
            if not order.user or not order.store:
                return Response(
                    {
                        'detail': 'Customer or store information is missing.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
            permission_allowed = CustomerCreditPermission.objects.filter(
                store=order.store,
                customer=order.user,
                is_allowed=True
            ).exists()
        
            if not permission_allowed:
                return Response(
                    {
                        'detail': 'This customer is not allowed to receive credit.'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )


        with transaction.atomic():
            handover = serializer.save(
                order=order,
                created_by=request.user
            )

            if remaining > 0:
                credit, created = CustomerCredit.objects.get_or_create(
                    order=order,
                    defaults={
                        'order_amount': total_amount,
                        'amount_paid': handed_over,
                        'credit_amount': remaining,
                    }
                )

                if not created:
                    credit.order_amount = total_amount
                    credit.amount_paid = handed_over
                    credit.credit_amount = remaining
                    credit.save(update_fields=[
                        'order_amount',
                        'amount_paid',
                        'credit_amount',
                        'updated_at',
                    ])

        return Response(
            DeliveryCashHandoverSerializer(handover).data,
            status=(
                status.HTTP_200_OK
                if existing
                else status.HTTP_201_CREATED
            )
        )



class AdminCreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {'detail': 'Administrator access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        credits = CustomerCredit.objects.select_related(
            'order', 'order__user', 'order__address', 'order__store'
        ).prefetch_related('payments').order_by('-created_at')

        if not request.user.is_superuser:
            allowed_orders = staff_order_queryset(request.user).values('id')
            credits = credits.filter(order_id__in=allowed_orders)

        search = request.query_params.get('search', '').strip()
        if search:
            credits = [
                credit for credit in credits
                if search.lower() in (
                    (credit.order.address.name if credit.order.address else '')
                    + ' ' +
                    (credit.order.phone or '')
                    + ' ' +
                    (credit.order.user.username if credit.order.user else '')
                ).lower()
            ]

        total_credit = sum(
            (credit.remaining_credit for credit in credits),
            Decimal('0.00')
        )

        return Response({
            'total_credit_amount': str(total_credit),
            'credits': CustomerCreditSerializer(
                credits, many=True
            ).data,
        })


    
    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {'detail': 'Administrator access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        order_id = request.data.get('order_id')

        try:
            order_amount = Decimal(str(request.data.get('order_amount')))
            amount_paid = Decimal(str(request.data.get('amount_paid', '0')))
        except Exception:
            return Response(
                {'detail': 'Enter valid order and paid amounts.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order_amount <= 0 or amount_paid < 0 or amount_paid > order_amount:
            return Response(
                {'detail': 'Invalid order amount or amount paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = get_object_or_404(
            staff_order_queryset(request.user),
            pk=order_id
        )

        # Check whether this customer is allowed to receive credit
        if not order.user or not order.store:
            return Response(
                {
                    'detail': 'Customer or store information is missing.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        permission_allowed = CustomerCreditPermission.objects.filter(
            store=order.store,
            customer=order.user,
            is_allowed=True
        ).exists()

        if not permission_allowed:
            return Response(
                {
                    'detail': 'This customer is not allowed to receive credit.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if order_amount != Decimal(str(order.total_amount)):
            return Response(
                {'detail': 'Order amount must match the actual order total.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        credit_amount = order_amount - amount_paid

        if credit_amount <= 0:
            return Response(
                {'detail': 'This order has no outstanding credit.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if CustomerCredit.objects.filter(order=order).exists():
            return Response(
                {'detail': 'A credit record already exists for this order.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        credit = CustomerCredit.objects.create(
            order=order,
            order_amount=order_amount,
            amount_paid=amount_paid,
            credit_amount=credit_amount
        )

        return Response(
            CustomerCreditSerializer(credit).data,
            status=status.HTTP_201_CREATED
        )



class AdminCreditDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_credit(self, request, credit_id):
        if not request.user.is_staff:
            return None

        credit = get_object_or_404(
            CustomerCredit.objects.select_related(
                'order', 'order__user', 'order__address', 'order__store'
            ).prefetch_related('payments'),
            pk=credit_id
        )

        if not request.user.is_superuser:
            allowed = staff_order_queryset(request.user).filter(
                pk=credit.order_id
            ).exists()
            if not allowed:
                return None

        return credit

    def get(self, request, credit_id):
        credit = self.get_credit(request, credit_id)
        if credit is None:
            return Response(
                {'detail': 'Not found or administrator access required.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(CustomerCreditSerializer(credit).data)

    def patch(self, request, credit_id):
        credit = self.get_credit(request, credit_id)
        if credit is None:
            return Response(
                {'detail': 'Not found or administrator access required.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Credit amount can be corrected by an admin.
        try:
            new_credit = Decimal(str(request.data.get(
                'credit_amount', credit.credit_amount
            )))
            new_paid = Decimal(str(request.data.get(
                'amount_paid', credit.amount_paid
            )))
            order_amount = Decimal(str(credit.order_amount))
        except Exception:
            return Response(
                {'detail': 'Enter valid amounts.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if min(new_credit, new_paid) < 0 or new_credit + new_paid != order_amount:
            return Response(
                {'detail': 'Amount paid plus credit must equal order amount.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        credit.credit_amount = new_credit
        credit.amount_paid = new_paid
        credit.save(update_fields=[
            'credit_amount', 'amount_paid', 'updated_at'
        ])

        return Response(CustomerCreditSerializer(credit).data)


class RecordCreditPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, credit_id):
        if not request.user.is_staff:
            return Response(
                {'detail': 'Administrator access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        credit = get_object_or_404(
            CustomerCredit.objects.select_for_update(of=('self',)),
            pk=credit_id
        )

        if not request.user.is_superuser:
            if not staff_order_queryset(request.user).filter(
                pk=credit.order_id
            ).exists():
                return Response(
                    {'detail': 'Credit not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        serializer = CustomerCreditPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data['amount']

        if amount > credit.remaining_credit:
            return Response(
                {'detail': 'Payment cannot exceed the remaining credit.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = serializer.save(credit=credit, received_by=request.user)

        return Response(
            {
                'payment': CustomerCreditPaymentSerializer(payment).data,
                'credit': CustomerCreditSerializer(credit).data,
            },
            status=status.HTTP_201_CREATED
        )


class MyCreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Shop Owner: Show credits from their own store
        if request.user.is_staff:
            allowed_orders = staff_order_queryset(
                request.user
            ).values('id')

            credits = CustomerCredit.objects.filter(
                order_id__in=allowed_orders
            )

        # Customer: Show only their own credits
        else:
            credits = CustomerCredit.objects.filter(
                order__user=request.user
            )

        credits = credits.select_related(
            'order',
            'order__user',
            'order__address',
            'order__store'
        ).prefetch_related(
            'payments'
        ).order_by('-created_at')

        serialized = CustomerCreditSerializer(
            credits,
            many=True
        ).data

        total_credit = sum(
            (credit.remaining_credit for credit in credits),
            Decimal('0.00')
        )

        return Response({
            'total_credit_amount': str(total_credit),
            'credits': serialized,
        })