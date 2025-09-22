@echo off
REM Run this batch file to start the development server with all necessary tasks scheduled

echo Starting development server with scheduled tasks...

REM First schedule the background tasks
python manage.py schedule_tasks

REM Then start the development server
python manage.py runserver 8000

pause