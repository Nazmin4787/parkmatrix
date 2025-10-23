"""
Management command to manually run long-stay vehicle detection
Usage: python manage.py detect_long_stay [--json] [--threshold-hours 24]
"""
from django.core.management.base import BaseCommand
from api.long_stay_detection import detect_long_stay_vehicles, LongStayDetectionService
import json
import datetime


class Command(BaseCommand):
    help = 'Detect vehicles parked beyond allowed duration (24 hours)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--json',
            action='store_true',
            help='Output results as JSON'
        )
        parser.add_argument(
            '--threshold-hours',
            type=int,
            default=24,
            help='Number of hours to consider as long-stay (default: 24)'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 Running long-stay vehicle detection...'))
        
        # Use custom threshold if provided
        if options['threshold_hours'] != 24:
            service = LongStayDetectionService(threshold_hours=options['threshold_hours'])
            results = service.detect_long_stay_vehicles()
        else:
            results = detect_long_stay_vehicles()
        
        if options['json']:
            # Output as JSON
            def converter(o):
                if isinstance(o, datetime.datetime):
                    return o.isoformat()
                return str(o)
            
            self.stdout.write(json.dumps(results, indent=2, default=converter))
        else:
            # Human-readable output
            self.stdout.write(self.style.SUCCESS(f"\n📊 Detection Summary:"))
            self.stdout.write(f"  Total Parked: {results['total_parked']}")
            self.stdout.write(f"  🚨 Critical (>24h): {results['summary']['critical_count']}")
            self.stdout.write(f"  ⚡ Warnings (>20h): {results['summary']['warning_count']}")
            self.stdout.write(f"  ✅ Normal: {results['summary']['normal_count']}")
            
            if results['long_stay_vehicles']:
                self.stdout.write(self.style.ERROR(f"\n🚨 LONG-STAY VEHICLES:"))
                for vehicle in results['long_stay_vehicles']:
                    self.stdout.write(
                        f"  • {vehicle['vehicle']['plate']} - "
                        f"Slot {vehicle['slot']['number']} - "
                        f"{vehicle['timing']['current_duration_formatted']} "
                        f"({vehicle['timing']['current_duration_hours']}h)"
                    )
                    self.stdout.write(
                        f"    User: {vehicle['user']['username']} ({vehicle['user']['email']})"
                    )
                    self.stdout.write(
                        f"    Location: {vehicle['slot']['parking_lot']}, Floor {vehicle['slot']['floor']}, Section {vehicle['slot']['section']}"
                    )
                    if vehicle['is_overtime']:
                        self.stdout.write(
                            self.style.WARNING(f"    ⏰ Overtime: {vehicle['overtime_hours']}h beyond expected checkout")
                        )
                    self.stdout.write("")  # Empty line for spacing
            
            if results['warning_vehicles']:
                self.stdout.write(self.style.WARNING(f"\n⚡ WARNING VEHICLES (Approaching Long-Stay):"))
                for vehicle in results['warning_vehicles']:
                    self.stdout.write(
                        f"  • {vehicle['vehicle']['plate']} - "
                        f"Slot {vehicle['slot']['number']} - "
                        f"{vehicle['timing']['current_duration_formatted']} "
                        f"({vehicle['timing']['current_duration_hours']}h)"
                    )
                    self.stdout.write(
                        f"    User: {vehicle['user']['username']}"
                    )
            
            if not results['long_stay_vehicles'] and not results['warning_vehicles']:
                self.stdout.write(self.style.SUCCESS("\n✅ No long-stay vehicles detected!"))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Detection complete'))
