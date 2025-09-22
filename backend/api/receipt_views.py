from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Booking
from .permissions import IsCustomerUser
from .notification_utils import create_payment_receipt_notification

class GenerateReceiptView(APIView):
    """
    Generate a detailed payment receipt for a completed booking.
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]
    
    def post(self, request, pk):
        try:
            # Only allow receipt generation for user's own completed bookings
            booking = Booking.objects.get(
                pk=pk,
                user=request.user,
                vehicle_has_left=True  # Booking must be completed
            )
        except Booking.DoesNotExist:
            return Response(
                {"error": "Completed booking not found or you don't have permission to access it."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate a detailed payment receipt notification
        notification = create_payment_receipt_notification(booking)
        
        return Response({
            "message": "Payment receipt generated successfully.",
            "receipt_id": notification.additional_data.get('receipt_id'),
            "notification_id": notification.id
        }, status=status.HTTP_200_OK)