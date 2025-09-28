@echo off
echo Activating virtual environment...
call ..\parking_env\Scripts\activate.bat
echo.
echo Virtual environment activated!
echo To start the Django development server, run:
echo python manage.py runserver
echo.
echo To deactivate the virtual environment, run:
echo deactivate
echo.
cmd /k