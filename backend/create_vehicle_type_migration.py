# Run this script to create the migration file

import os
import django
from django.core.management import execute_from_command_line

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Create migration
execute_from_command_line(['manage.py', 'makemigrations', 'api', '--name', 'add_vehicle_type_to_slots'])