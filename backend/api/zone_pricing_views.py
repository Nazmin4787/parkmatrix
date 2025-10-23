from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Q
from .models import ZonePricingRate
from .serializers import ZonePricingRateSerializer, ZonePricingRateBulkUpdateSerializer
from .permissions import IsAdminUser


class ZonePricingRateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing zone pricing rates.
    
    Endpoints:
    - GET /api/zone-pricing/ - List all zone pricing rates
    - POST /api/zone-pricing/ - Create new zone pricing rate
    - GET /api/zone-pricing/{id}/ - Retrieve specific rate
    - PUT/PATCH /api/zone-pricing/{id}/ - Update rate
    - DELETE /api/zone-pricing/{id}/ - Delete rate
    - POST /api/zone-pricing/bulk_update/ - Bulk update rates
    - GET /api/zone-pricing/active_rates/ - Get all active rates
    - GET /api/zone-pricing/by_zone/ - Get rates filtered by zone
    """
    queryset = ZonePricingRate.objects.all()
    serializer_class = ZonePricingRateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_permissions(self):
        """
        Override to allow customers to read active rates and rates by zone
        """
        if self.action in ['active_rates', 'by_zone', 'rate_summary']:
            # Allow authenticated users (including customers) to view active rates
            return [IsAuthenticated()]
        # All other actions require admin
        return [IsAuthenticated(), IsAdminUser()]
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = ZonePricingRate.objects.all()
        
        # Filter by parking zone
        parking_zone = self.request.query_params.get('parking_zone', None)
        if parking_zone:
            queryset = queryset.filter(parking_zone=parking_zone)
        
        # Filter by vehicle type
        vehicle_type = self.request.query_params.get('vehicle_type', None)
        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Filter by validity (currently effective)
        only_valid = self.request.query_params.get('only_valid', None)
        if only_valid and only_valid.lower() == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                is_active=True,
                effective_from__lte=now
            ).filter(
                Q(effective_to__isnull=True) | Q(effective_to__gte=now)
            )
        
        return queryset.select_related('created_by')
    
    def perform_create(self, serializer):
        """Set the created_by field to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Bulk update or create zone pricing rates.
        
        POST /api/zone-pricing/bulk_update/
        Body: {
            "rates": [
                {
                    "parking_zone": "COLLEGE_PARKING_CENTER",
                    "vehicle_type": "car",
                    "rate_name": "College Car Rate",
                    "hourly_rate": 15.00,
                    "daily_rate": 100.00,
                    "is_active": true
                },
                ...
            ]
        }
        """
        serializer = ZonePricingRateBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        created_rates = []
        updated_rates = []
        errors = []
        
        for rate_data in serializer.validated_data['rates']:
            try:
                # Check if rate exists
                existing_rate = ZonePricingRate.objects.filter(
                    parking_zone=rate_data['parking_zone'],
                    vehicle_type=rate_data['vehicle_type'],
                    is_active=True
                ).first()
                
                if existing_rate:
                    # Update existing rate
                    rate_serializer = ZonePricingRateSerializer(
                        existing_rate,
                        data=rate_data,
                        partial=True
                    )
                    rate_serializer.is_valid(raise_exception=True)
                    rate_serializer.save()
                    updated_rates.append(rate_serializer.data)
                else:
                    # Create new rate
                    rate_serializer = ZonePricingRateSerializer(data=rate_data)
                    rate_serializer.is_valid(raise_exception=True)
                    rate_serializer.save(created_by=request.user)
                    created_rates.append(rate_serializer.data)
                    
            except Exception as e:
                errors.append({
                    'rate': rate_data,
                    'error': str(e)
                })
        
        return Response({
            'message': f'Bulk update completed. Created: {len(created_rates)}, Updated: {len(updated_rates)}, Errors: {len(errors)}',
            'created': created_rates,
            'updated': updated_rates,
            'errors': errors
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def active_rates(self, request):
        """
        Get all currently active and valid rates.
        
        GET /api/zone-pricing/active_rates/
        """
        now = timezone.now()
        active_rates = ZonePricingRate.objects.filter(
            is_active=True,
            effective_from__lte=now
        ).filter(
            Q(effective_to__isnull=True) | Q(effective_to__gte=now)
        ).select_related('created_by')
        
        serializer = self.get_serializer(active_rates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_zone(self, request):
        """
        Get rates organized by parking zone.
        
        GET /api/zone-pricing/by_zone/?zone=COLLEGE_PARKING_CENTER
        """
        zone = request.query_params.get('zone', None)
        if not zone:
            return Response(
                {'error': 'Zone parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rates = ZonePricingRate.objects.filter(
            parking_zone=zone,
            is_active=True
        ).select_related('created_by')
        
        serializer = self.get_serializer(rates, many=True)
        
        return Response({
            'zone': zone,
            'zone_display': dict(ZonePricingRate.PARKING_ZONE_CHOICES).get(zone, zone),
            'rates': serializer.data,
            'count': rates.count()
        })
    
    @action(detail=False, methods=['get'])
    def rate_summary(self, request):
        """
        Get summary of all active rates organized by zone.
        
        GET /api/zone-pricing/rate_summary/
        """
        zones = ZonePricingRate.PARKING_ZONE_CHOICES
        summary = []
        
        for zone_code, zone_name in zones:
            rates = ZonePricingRate.objects.filter(
                parking_zone=zone_code,
                is_active=True
            ).select_related('created_by')
            
            zone_data = {
                'zone_code': zone_code,
                'zone_name': zone_name,
                'rates': ZonePricingRateSerializer(rates, many=True).data,
                'rate_count': rates.count()
            }
            summary.append(zone_data)
        
        return Response({
            'summary': summary,
            'total_zones': len(zones),
            'total_active_rates': ZonePricingRate.objects.filter(is_active=True).count()
        })
