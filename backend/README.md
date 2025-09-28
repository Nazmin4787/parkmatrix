# Backend Setup Guide

## Prerequisites
- Python 3.12+ installed
- PostgreSQL database (optional - can use SQLite for development)

## Setup Instructions

### 1. Navigate to the project root
```bash
cd c:/Projects/parking-system
```

### 2. Activate the virtual environment
**PowerShell:**
```powershell
.\parking_env\Scripts\Activate.ps1
```

**Command Prompt:**
```cmd
.\parking_env\Scripts\activate.bat
```

### 3. Navigate to backend directory
```bash
cd backend
```

### 4. Install dependencies (already done)
```bash
pip install -r requirements.txt
```

### 5. Environment Configuration
The `.env` file has been created with default settings. Update the following variables as needed:
- `SECRET_KEY`: Django secret key (change for production)
- `DEBUG`: Set to `False` for production
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database credentials
- Email and Razorpay settings for production features

### 6. Database Setup
```bash
# Create and apply migrations
python manage.py makemigrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser
```

### 7. Run the development server
```bash
python manage.py runserver
```

The server will be available at: http://127.0.0.1:8000/

## Quick Start Scripts
- **activate_env.ps1**: PowerShell script to activate virtual environment
- **activate_env.bat**: Batch script to activate virtual environment
- **start_dev_server.bat**: Existing script to start the server

## Installed Packages
- Django 4.1.13
- Django REST Framework 3.15.1
- Django CORS Headers 4.5.0
- Django REST Framework SimpleJWT 5.3.1
- PostgreSQL adapter (psycopg2-binary)
- Python Decouple for environment variables
- Gunicorn for production deployment
- WhiteNoise for static file serving
- Razorpay for payment processing
- Geopy for location services

## Project Structure
```
backend/
├── api/                    # Main Django app
├── backend/               # Django project settings
├── scripts/               # Utility scripts
├── manage.py             # Django management script
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables
└── activate_env.*        # Virtual environment activation scripts
```