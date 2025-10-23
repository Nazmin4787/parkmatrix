"""
Views for managing parking rates.
Handles CRUD operations, fee calculations, and rate management.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from decimal import Decimal

from .models import PricingRate
from .serializers import (
    PricingRateSerializer,
    PricingRateListSerializer,
    PricingRateCreateUpdateSerializer,
    FeeCalculationSerializer,
    FeeCalculationResponseSerializer
)
from .permissions import IsAdminUser


class PricingRateListCreateView(generics.ListCreateAPIView):
    """
    GET: List all pricing rates (admin only)
    POST: Create a new pricing rate (admin only)
    """
    queryset = PricingRate.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PricingRateCreateUpdateSerializer
        return PricingRateListSerializer
    
    def get_queryset(self):
        """
        Optionally filter by vehicle type or active status
        """
        queryset = PricingRate.objects.all()
        
        # Filter by vehicle type
        vehicle_type = self.request.query_params.get('vehicle_type', None)
        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by default status
        is_default = self.request.query_params.get('is_default', None)
        if is_default is not None:
            queryset = queryset.filter(is_default=is_default.lower() == 'true')
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new pricing rate with validation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return full details of created rate
        rate = serializer.instance
        response_serializer = PricingRateSerializer(rate)
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'message': 'Pricing rate created successfully',
                'data': response_serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class PricingRateRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a specific pricing rate
    PUT/PATCH: Update a pricing rate (admin only)
    DELETE: Delete a pricing rate (admin only)
    """
    queryset = PricingRate.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PricingRateCreateUpdateSerializer
        return PricingRateSerializer
    
    def update(self, request, *args, **kwargs):
        """Update a pricing rate with validation"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return full details of updated rate
        response_serializer = PricingRateSerializer(serializer.instance)
        
        return Response({
            'message': 'Pricing rate updated successfully',
            'data': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete a pricing rate"""
        instance = self.get_object()
        rate_name = instance.rate_name
        self.perform_destroy(instance)
        
        return Response({
            'message': f'Pricing rate "{rate_name}" deleted successfully'
        }, status=status.HTTP_200_OK)


class PricingRateByVehicleTypeView(generics.ListAPIView):
    """
    GET: Get all active rates for a specific vehicle type
    Accessible by authenticated users
    """
    serializer_class = PricingRateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        vehicle_type = self.kwargs.get('vehicle_type')
        return PricingRate.objects.filter(
            vehicle_type=vehicle_type,
            is_active=True
        ).filter(
            effective_from__lte=timezone.now()
        ).filter(
            effective_to__gte=timezone.now()
        ) | PricingRate.objects.filter(
            vehicle_type=vehicle_type,
            is_active=True,
            effective_to__isnull=True
        )


class ActiveRatesView(generics.ListAPIView):
    """
    GET: Get all currently active and valid rates
    Accessible by all authenticated users
    """
    serializer_class = PricingRateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only active rates that are currently valid"""
        now = timezone.now()
        return PricingRate.objects.filter(
            is_active=True
        ).filter(
            effective_from__lte=now,
            effective_to__gte=now
        ) | PricingRate.objects.filter(
            is_active=True,
            effective_from__lte=now,
            effective_to__isnull=True
        ) | PricingRate.objects.filter(
            is_active=True,
            effective_from__isnull=True
        )


class SetDefaultRateView(APIView):
    """
    POST: Set a specific rate as the default for its vehicle type
    Admin only
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, pk):
        try:
            rate = PricingRate.objects.get(pk=pk)
        except PricingRate.DoesNotExist:
            return Response(
                {'error': 'Pricing rate not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Set this rate as default (model's save method handles uniqueness)
        rate.is_default = True
        rate.save()
        
        serializer = PricingRateSerializer(rate)
        return Response({
            'message': f'Rate "{rate.rate_name}" set as default for {rate.get_vehicle_type_display()}',
            'data': serializer.data
        })


class CalculateParkingFeeView(APIView):
    """
    POST: Calculate parking fee based on vehicle type, duration, and date/time
    Accessible by all users (including unauthenticated for preview)
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Validate input
        input_serializer = FeeCalculationSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        
        vehicle_type = input_serializer.validated_data['vehicle_type']
        hours = float(input_serializer.validated_data.get('hours', 0))
        days = input_serializer.validated_data.get('days', 0)
        booking_datetime = input_serializer.validated_data.get('booking_datetime') or timezone.now()
        
        # Find appropriate rate for vehicle type
        try:
            # First, try to get default rate for the vehicle type
            rate = PricingRate.objects.filter(
                vehicle_type=vehicle_type,
                is_active=True,
                is_default=True
            ).first()
            
            # If no default, get any active rate for the vehicle type
            if not rate:
                rate = PricingRate.objects.filter(
                    vehicle_type=vehicle_type,
                    is_active=True
                ).first()
            
            # If still no rate, try 'all' vehicle type
            if not rate:
                rate = PricingRate.objects.filter(
                    vehicle_type='all',
                    is_active=True,
                    is_default=True
                ).first()
            
            if not rate:
                return Response(
                    {'error': f'No active rate found for vehicle type: {vehicle_type}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except Exception as e:
            return Response(
                {'error': f'Error finding rate: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Calculate fee
        total_fee = rate.calculate_fee(hours=hours, days=days, booking_datetime=booking_datetime)
        applicable_rate = rate.get_applicable_rate(booking_datetime)
        
        # Check if it's weekend or special time
        is_weekend = booking_datetime.weekday() in [5, 6]
        is_special_time = False
        
        if rate.time_slot_start and rate.time_slot_end:
            booking_time = booking_datetime.time()
            if rate.time_slot_start <= rate.time_slot_end:
                is_special_time = rate.time_slot_start <= booking_time <= rate.time_slot_end
            else:
                is_special_time = booking_time >= rate.time_slot_start or booking_time <= rate.time_slot_end
        
        # Build breakdown
        breakdown = {
            'base_rate': f'₹{float(rate.hourly_rate)}/hour',
            'hours': hours,
            'days': days,
            'applicable_rate_type': 'regular'
        }
        
        if is_weekend and rate.weekend_rate:
            breakdown['applicable_rate_type'] = 'weekend'
            breakdown['rate_applied'] = f'₹{float(rate.weekend_rate)}/hour'
        elif is_special_time and rate.special_rate:
            breakdown['applicable_rate_type'] = 'special_time_slot'
            breakdown['rate_applied'] = f'₹{float(rate.special_rate)}/hour'
        else:
            breakdown['rate_applied'] = f'₹{float(rate.hourly_rate)}/hour'
        
        if days > 0 and rate.daily_rate:
            breakdown['daily_rate'] = f'₹{float(rate.daily_rate)}/day'
            breakdown['daily_charge'] = f'₹{float(rate.daily_rate * days)}'
        
        if hours > 0:
            breakdown['hourly_charge'] = f'₹{float(applicable_rate * Decimal(str(hours)))}'
        
        # Prepare response
        response_data = {
            'vehicle_type': rate.get_vehicle_type_display(),
            'rate_name': rate.rate_name,
            'hourly_rate': float(rate.hourly_rate),
            'daily_rate': float(rate.daily_rate) if rate.daily_rate else None,
            'applicable_rate': float(applicable_rate),
            'hours': hours,
            'days': days,
            'total_fee': float(total_fee),
            'breakdown': breakdown,
            'is_weekend': is_weekend,
            'is_special_time': is_special_time
        }
        
        return Response({
            'message': 'Fee calculated successfully',
            'data': response_data
        })


class DefaultRatesByVehicleView(APIView):
    """
    GET: Get default rates for all vehicle types
    Useful for displaying rate cards on booking page
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get all default rates grouped by vehicle type"""
        default_rates = PricingRate.objects.filter(
            is_default=True,
            is_active=True
        ).order_by('vehicle_type')
        
        serializer = PricingRateSerializer(default_rates, many=True)
        
        return Response({
            'message': 'Default rates retrieved successfully',
            'data': serializer.data,
            'count': default_rates.count()
        })
