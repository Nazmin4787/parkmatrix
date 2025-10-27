# Revenue Management Backend API Specification

## Overview
This document specifies the backend API requirements for the Revenue Management dashboard feature.

## Required Endpoints

### 1. Get Revenue Data
**Endpoint:** `/api/admin/revenue/`  
**Method:** `GET`  
**Authentication:** Required (Admin role only)

#### Query Parameters
- `start_date` (optional): ISO date string (e.g., "2024-01-01")
- `end_date` (optional): ISO date string (e.g., "2024-01-31")
- `zone` (optional): Filter by specific zone name
- `vehicle_type` (optional): Filter by vehicle type (Car, Bike, Truck, Bus)

#### Response Structure
```json
{
  "total_revenue": 15240.50,
  "booking_revenue": 13500.00,
  "overstay_revenue": 1740.50,
  "today_revenue": 850.00,
  "month_revenue": 12500.00,
  "percentage": 12.5,
  "by_zone": [
    {
      "zone": "Zone A",
      "revenue": 5200.00,
      "bookings": 45,
      "overstay": 320.50
    },
    {
      "zone": "Zone B",
      "revenue": 4800.00,
      "bookings": 38,
      "overstay": 215.00
    }
  ],
  "by_vehicle_type": [
    {
      "vehicle_type": "Car",
      "revenue": 8500.00,
      "count": 120
    },
    {
      "vehicle_type": "Bike",
      "revenue": 3200.00,
      "count": 85
    },
    {
      "vehicle_type": "Truck",
      "revenue": 2400.00,
      "count": 30
    }
  ],
  "recent_transactions": [
    {
      "id": 1245,
      "vehicle": "ABC1234",
      "zone": "Zone A",
      "amount": 50.00,
      "overstay": 15.50,
      "total": 65.50,
      "date": "2024-01-15 14:30:00"
    }
  ]
}
```

#### Field Descriptions
- **total_revenue**: Sum of all booking amounts and overstay fees
- **booking_revenue**: Sum of base booking amounts only
- **overstay_revenue**: Sum of all overstay fees
- **today_revenue**: Revenue generated today
- **month_revenue**: Revenue for current month
- **percentage**: Month-over-month growth percentage
- **by_zone[]**: Revenue breakdown per parking zone
  - `zone`: Zone name
  - `revenue`: Total revenue from this zone
  - `bookings`: Number of bookings in this zone
  - `overstay`: Overstay fees collected from this zone
- **by_vehicle_type[]**: Revenue breakdown by vehicle type
  - `vehicle_type`: Type of vehicle (Car, Bike, Truck, Bus)
  - `revenue`: Total revenue from this vehicle type
  - `count`: Number of vehicles of this type
- **recent_transactions[]**: Latest 20 transactions
  - `id`: Booking ID
  - `vehicle`: Vehicle registration number
  - `zone`: Parking zone name
  - `amount`: Base booking amount
  - `overstay`: Overstay fee (0 if none)
  - `total`: Total amount (amount + overstay)
  - `date`: Transaction date/time

### 2. Record Overstay Payment
**Endpoint:** `/api/customer/overstay/payment/`  
**Method:** `POST`  
**Authentication:** Required (Customer role)

#### Request Body
```json
{
  "booking_id": 1245,
  "overstay_amount": 15.50,
  "payment_method": "card"
}
```

#### Response
```json
{
  "success": true,
  "message": "Overstay fee payment recorded successfully",
  "booking_id": 1245,
  "amount_paid": 15.50,
  "payment_date": "2024-01-15T14:30:00Z"
}
```

#### Error Response (400)
```json
{
  "success": false,
  "error": "Invalid booking ID or overstay amount"
}
```

## Database Considerations

### Booking Model Updates
Ensure the `Booking` model includes:
- `checked_in_at`: DateTime when customer checked in
- `checked_out_at`: DateTime when customer checked out
- `overstay_amount`: Decimal field for overstay fee (default 0)
- `overstay_paid`: Boolean flag (default False)
- `overstay_paid_at`: DateTime when overstay was paid (nullable)

### Revenue Calculation Logic

#### Total Revenue Calculation
```python
total_revenue = Booking.objects.filter(
    status__in=['checked_out', 'checkout_verified']
).aggregate(
    booking_total=Sum('amount'),
    overstay_total=Sum('overstay_amount')
)['booking_total'] + total_revenue['overstay_total']
```

#### Overstay Fee Calculation
```python
from datetime import datetime, timedelta

def calculate_overstay(booking):
    """
    Calculate overstay fee based on end_time and current/checkout time
    """
    if booking.status not in ['checked_in', 'checkout_requested', 'checkout_verified']:
        return 0
    
    end_time = booking.end_time
    current_time = booking.checked_out_at if booking.checked_out_at else datetime.now()
    
    if current_time > end_time:
        # Calculate overstay in hours
        overstay_duration = current_time - end_time
        overstay_hours = overstay_duration.total_seconds() / 3600
        
        # Apply hourly rate
        hourly_rate = booking.parking_zone.hourly_rate
        overstay_fee = overstay_hours * hourly_rate
        
        return round(overstay_fee, 2)
    
    return 0
```

#### Revenue by Zone
```python
from django.db.models import Sum, Count

zone_revenue = Booking.objects.filter(
    status='checked_out'
).values('parking_zone__name').annotate(
    revenue=Sum('amount') + Sum('overstay_amount'),
    bookings=Count('id'),
    overstay=Sum('overstay_amount')
)
```

#### Revenue by Vehicle Type
```python
vehicle_revenue = Booking.objects.filter(
    status='checked_out'
).values('vehicle__vehicle_type').annotate(
    revenue=Sum('amount') + Sum('overstay_amount'),
    count=Count('id')
)
```

## Implementation Checklist

### Backend Tasks
- [ ] Create `/api/admin/revenue/` view
- [ ] Add date range filtering
- [ ] Add zone and vehicle type filtering
- [ ] Implement aggregation queries for revenue summary
- [ ] Calculate month-over-month percentage
- [ ] Add pagination for recent transactions (limit 20)
- [ ] Create `/api/customer/overstay/payment/` endpoint
- [ ] Update Booking model with overstay fields
- [ ] Add payment recording logic
- [ ] Update checkout verification to check overstay payment
- [ ] Add admin permission checks

### Testing Tasks
- [ ] Test revenue calculation accuracy
- [ ] Test filtering by date range
- [ ] Test filtering by zone
- [ ] Test filtering by vehicle type
- [ ] Test overstay payment recording
- [ ] Test checkout blocking when overstay unpaid
- [ ] Test empty data scenarios
- [ ] Test error handling
- [ ] Test admin-only access

### Security Considerations
- Ensure admin-only access to revenue endpoint
- Validate booking ownership for overstay payments
- Prevent duplicate overstay payments
- Validate payment amounts match calculated overstay
- Add rate limiting to prevent abuse

## Frontend Integration Status
✅ Revenue Management component created  
✅ Route and navigation added  
✅ Empty state handling implemented  
✅ Real API calls configured (demo mode removed)  
✅ Date range and filter controls ready  
✅ CSV export functionality implemented  
⏳ Waiting for backend API implementation

## Notes
- The frontend component expects the exact JSON structure defined above
- All monetary values should be returned as numbers with 2 decimal places
- Dates should be in ISO 8601 format or readable string format
- Empty arrays should be returned (not null) when no data available
- Error responses should include descriptive error messages
