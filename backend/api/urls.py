from django.urls import path, include
from . import views
from . import parking_search
from .views import (
    RegisterUserView, LoginView, LogoutView, TokenRefreshView, VerifyEmailView, PasswordResetRequestView, PasswordResetConfirmView,
    ParkingSlotListCreateView, ParkingSlotRetrieveUpdateDestroyView,
    AvailableParkingSlotsView, BookingCreateView, UserBookingListView, CancelBookingView,
    find_nearest_slot,VehicleListCreateView, VehicleRetrieveUpdateDestroyView,UserVehiclesView, BookingReportView,
    NotificationListView, NotificationMarkAsReadView, NotificationDeleteView, NotificationUnreadCountView,
    MarkAllNotificationsAsReadView, SystemAlertCreateView, MaintenanceAlertCreateView, SystemNotificationStatusView,
    APIRootView, SlotManagementView, BulkSlotUpdateView,
    CheckInView, CheckOutView, ActiveBookingView,
    NearestParkingView,  # NEW: Import the new view
)
from .notification_public_views import PublicNotificationUnreadCountView
from .receipt_views import GenerateReceiptView
from .upcoming_views import UpcomingBookingsView
from .early_checkin import EarlyCheckInView
from . import access_log_views
from . import checkin_checkout_log_views
from . import user_history_views
from .slot_tracking_views import SlotStatisticsView, DetailedSlotStatusView, SlotUpdatesView
from .active_bookings_view import ActiveBookingsWithDetailsView

urlpatterns = [
    path('', APIRootView.as_view(), name='api-root'),
    path('auth/register/', RegisterUserView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/verify-email/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/reset-password/', PasswordResetRequestView.as_view(), name='reset-password-request'),
    path('auth/reset-password/<str:uidb64>/<str:token>/', PasswordResetConfirmView.as_view(), name='reset-password-confirm'),

    path('slots/available/', AvailableParkingSlotsView.as_view(), name='available-slots'),
    path('slots/', ParkingSlotListCreateView.as_view(), name='slot-list-create'),
    path('slots/<int:pk>/', ParkingSlotRetrieveUpdateDestroyView.as_view(), name='slot-detail'),

    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/my/', UserBookingListView.as_view(), name='my-bookings'),
    path('bookings/active/', views.ActiveBookingView.as_view(), name='active-booking'),
    path('bookings/upcoming/', UpcomingBookingsView.as_view(), name='upcoming-bookings'),
    path('bookings/price-preview/', views.PricePreviewView.as_view(), name='price-preview'),
    path('bookings/<int:pk>/checkin/', views.CheckInView.as_view(), name='booking-checkin'),
    path('bookings/<int:pk>/checkout/', views.CheckOutView.as_view(), name='booking-checkout'),
    path('bookings/<int:pk>/cancel/', CancelBookingView.as_view(), name='cancel-booking'),
    path('bookings/<int:pk>/extend/', views.ExtendBookingView.as_view(), name='extend-booking'),
    path('bookings/<int:pk>/mark-left/', views.MarkVehicleLeftView.as_view(), name='mark-vehicle-left'),
    path('bookings/<int:pk>/receipt/', GenerateReceiptView.as_view(), name='generate-receipt'),
    path('bookings/early-checkin/', EarlyCheckInView.as_view(), name='early-checkin'),

    # Vehicle management
    path('vehicles/', VehicleListCreateView.as_view(), name='vehicle-list-create'),
    path('vehicles/<int:pk>/', VehicleRetrieveUpdateDestroyView.as_view(), name='vehicle-detail'),
    path('vehicles/default/', views.UserDefaultVehicleView.as_view(), name='user-default-vehicle'),
    path('vehicles/<int:pk>/set_default/', views.SetDefaultVehicleView.as_view(), name='user-set-default-vehicle'),

    # Admin booking management
    # REMOVED: View Bookings feature
    # path('admin/bookings/', AdminAllBookingsView.as_view(), name='admin-all-bookings'),
    # path('admin/bookings/<int:pk>/cancel/', AdminCancelBookingView.as_view(), name='admin-cancel-booking'),
    path('parking-lots/', views.ParkingLotsByLocationView.as_view(), name='parking-lots-by-location'),
    path('slots/find-nearest/', find_nearest_slot, name='find-nearest-slot'),
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
    
    # NEW: Nearest parking locations endpoint (GPS-based)
    path('parking/nearest/', NearestParkingView.as_view(), name='nearest-parking-locations'),

    # Admin slot management
    path('admin/slots/', views.SlotManagementView.as_view(), name='admin-slot-management'),
    path('admin/slots/<int:pk>/', views.SlotDetailView.as_view(), name='admin-slot-detail'),
    path('admin/slots/bulk-update/', views.BulkSlotUpdateView.as_view(), name='bulk-slot-update'),
    
    # Slot tracking and statistics
    path('slots/statistics/', SlotStatisticsView.as_view(), name='slot-statistics'),
    path('slots/detailed-status/', DetailedSlotStatusView.as_view(), name='detailed-slot-status'),
    path('slots/updates/', SlotUpdatesView.as_view(), name='slot-updates'),
    path('bookings/active-with-details/', ActiveBookingsWithDetailsView.as_view(), name='active-bookings-with-details'),
    
    # Access Logs (Admin only)
    path('admin/access-logs/', access_log_views.AccessLogListView.as_view(), name='access-log-list'),
    path('admin/access-logs/<int:pk>/', access_log_views.AccessLogDetailView.as_view(), name='access-log-detail'),
    path('admin/access-logs/stats/', access_log_views.AccessLogStatsView.as_view(), name='access-log-stats'),
    path('admin/access-logs/export/', access_log_views.AccessLogExportView.as_view(), name='access-log-export'),
    path('access-logs/my/', access_log_views.my_access_logs, name='my-access-logs'),
    path('auth/check-status/', access_log_views.check_auth_status, name='check-auth-status'),
    
    # Check-In/Check-Out Logs (Admin and Security)
    path('admin/checkin-checkout-logs/', checkin_checkout_log_views.CheckInCheckOutLogListView.as_view(), name='checkin-checkout-log-list'),
    path('admin/checkin-checkout-logs/<int:pk>/', checkin_checkout_log_views.CheckInCheckOutLogDetailView.as_view(), name='checkin-checkout-log-detail'),
    path('admin/checkin-checkout-logs/stats/', checkin_checkout_log_views.CheckInCheckOutLogStatsView.as_view(), name='checkin-checkout-log-stats'),
    path('admin/checkin-checkout-logs/export/', checkin_checkout_log_views.CheckInCheckOutLogExportView.as_view(), name='checkin-checkout-log-export'),
    path('admin/currently-parked/', checkin_checkout_log_views.currently_parked_vehicles, name='currently-parked-vehicles'),
    
    # User Check-In/Check-Out Logs
    path('checkin-checkout-logs/my/', checkin_checkout_log_views.user_checkin_checkout_logs, name='user-checkin-checkout-logs'),
    path('parking/current/', checkin_checkout_log_views.my_current_parking, name='my-current-parking'),
    
    # FEATURE 2: User Parking History
    path('user/parking-history/', user_history_views.user_parking_history_list, name='user-parking-history'),
    path('user/parking-history/<int:pk>/', user_history_views.user_parking_history_detail, name='user-parking-history-detail'),
    path('user/parking-history/stats/', user_history_views.user_parking_stats, name='user-parking-stats'),
    path('user/parking-history/export/', user_history_views.user_parking_history_export, name='user-parking-history-export'),
    
    # Admin access to user history
    path('admin/user-history/<int:user_id>/', user_history_views.admin_user_history, name='admin-user-history'),
    path('admin/user-history/<int:user_id>/stats/', user_history_views.admin_user_stats, name='admin-user-stats'),
    path('admin/users/', user_history_views.admin_users_list, name='admin-users-list'),
]
