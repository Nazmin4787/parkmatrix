#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
sys.path.append(r'C:\Projects\parking-system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from django.db import connection
from api.models import ParkingSlot
from django.core.management.color import no_style

def check_db_schema():
    style = no_style()
    with connection.cursor() as cursor:
        # Get the table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'api_parkingslot'
            ORDER BY ordinal_position;
        """)
        
        print("🗃️ Database schema for api_parkingslot:")
        print("-" * 60)
        for row in cursor.fetchall():
            column, data_type, nullable, default = row
            print(f"{column:<20} | {data_type:<15} | Null: {nullable:<5} | Default: {default}")
        
        print("\n📝 Model fields from Django:")
        print("-" * 40)
        for field in ParkingSlot._meta.fields:
            print(f"{field.name:<20} | {field.__class__.__name__}")

if __name__ == '__main__':
    check_db_schema()