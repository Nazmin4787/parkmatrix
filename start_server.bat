@echo off
REM This batch file activates the virtual environment and starts the Django server

echo Activating virtual environment and starting Django server...

REM Activate virtual environment
call myenvv\Scripts\activate.bat

REM Install or update required packages
pip install -r backend\requirements.txt

REM Start Django server
cd backend
python manage.py runserver 8000

pause