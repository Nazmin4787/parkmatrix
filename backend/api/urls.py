from django.urls import path, include
from . import views
from . import parking_search
from .views import (
    RegisterUserView, LoginView, TokenRefreshView, VerifyEmailView, PasswordResetRequestView, PasswordResetConfirmView,
    ParkingSlotListCreateView, ParkingSlotRetrieveUpdateDestroyView,
    AvailableParkingSlotsView, BookingCreateView, UserBookingListView, CancelBookingView,
    AdminAllBookingsView, AdminCancelBookingView, find_nearest_slot,VehicleListCreateView, VehicleRetrieveUpdateDestroyView,UserVehiclesView, BookingReportView,
    NotificationListView, NotificationMarkAsReadView, NotificationDeleteView, NotificationUnreadCountView,
    MarkAllNotificationsAsReadView, SystemAlertCreateView, MaintenanceAlertCreateView, SystemNotificationStatusView,
    APIRootView, SlotManagementView, BulkSlotUpdateView, SlotStatisticsView,
)
from .notification_public_views import PublicNotificationUnreadCountView
from .receipt_views import GenerateReceiptView
from .upcoming_views import UpcomingBookingsView
from .early_checkin import EarlyCheckInView

urlpatterns = [
    path('', APIRootView.as_view(), name='api-root'),
    path('auth/register/', RegisterUserView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/verify-email/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/reset-password/', PasswordResetRequestView.as_view(), name='reset-password-request'),
    path('auth/reset-password/<str:uidb64>/<str:token>/', PasswordResetConfirmView.as_view(), name='reset-password-confirm'),

    path('slots/available/', AvailableParkingSlotsView.as_view(), name='available-slots'),
    path('slots/', ParkingSlotListCreateView.as_view(), name='slot-list-create'),
    path('slots/<int:pk>/', ParkingSlotRetrieveUpdateDestroyView.as_view(), name='slot-detail'),

    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/user/', UserBookingListView.as_view(), name='user-bookings'),
    path('bookings/upcoming/', UpcomingBookingsView.as_view(), name='upcoming-bookings'),
    path('bookings/price-preview/', views.PricePreviewView.as_view(), name='price-preview'),
    path('bookings/<int:pk>/cancel/', CancelBookingView.as_view(), name='cancel-booking'),
    path('bookings/<int:pk>/extend/', views.ExtendBookingView.as_view(), name='extend-booking'),
    path('bookings/<int:pk>/mark-left/', views.MarkVehicleLeftView.as_view(), name='mark-vehicle-left'),
    path('bookings/<int:pk>/receipt/', GenerateReceiptView.as_view(), name='generate-receipt'),
    path('bookings/early-checkin/', EarlyCheckInView.as_view(), name='early-checkin'),

    # Admin booking management
    path('admin/bookings/', AdminAllBookingsView.as_view(), name='admin-all-bookings'),
    path('admin/bookings/<int:pk>/cancel/', AdminCancelBookingView.as_view(), name='admin-cancel-booking'),
    path('parking-lots/', views.ParkingLotsByLocationView.as_view(), name='parking-lots-by-location'),
    path('slots/find-nearest/', find_nearest_slot, name='find-nearest-slot'),
    path('vehicles/list/', UserVehiclesView.as_view(), name='user-vehicles'),
    path('vehicles/', VehicleListCreateView.as_view(), name='vehicle-list-create'),
    path('vehicles/<int:pk>/', VehicleRetrieveUpdateDestroyView.as_view(), name='vehicle-detail'),
    path('reports/booking-by-vehicle-type/', BookingReportView.as_view(), name='booking-report'),
    
    # Notification endpoints
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread_count/', PublicNotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('notifications/mark_all_as_read/', MarkAllNotificationsAsReadView.as_view(), name='mark-all-notifications-read'),
    path('notifications/<int:pk>/read/', NotificationMarkAsReadView.as_view(), name='notification-mark-read'),
    path('notifications/<int:pk>/delete/', NotificationDeleteView.as_view(), name='notification-delete'),
    
    # System administration endpoints
    path('admin/system-alert/', SystemAlertCreateView.as_view(), name='system-alert-create'),
    path('admin/maintenance-alert/', MaintenanceAlertCreateView.as_view(), name='maintenance-alert-create'),
    path('admin/notification-stats/', SystemNotificationStatusView.as_view(), name='notification-stats'),

    # Parking search endpoints
    path('parking-lots/nearest/', parking_search.NearestParkingLotsView.as_view(), name='nearest-parking-lots'),
    path('parking-lots/search/', parking_search.search_parking_by_address, name='search-parking-by-address'),

    # Admin slot management
    path('admin/slots/', views.SlotManagementView.as_view(), name='admin-slot-management'),
    path('admin/slots/<int:pk>/', views.SlotDetailView.as_view(), name='admin-slot-detail'),
    path('admin/slots/bulk-update/', views.BulkSlotUpdateView.as_view(), name='bulk-slot-update'),
    path('admin/slots/statistics/', views.SlotStatisticsView.as_view(), name='slot-statistics'),
]
