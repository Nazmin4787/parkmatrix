"""
Test script for the email notification system

Usage:
    python test_email_system.py [--send-test-email email@example.com]
    python test_email_system.py --check-config
"""

import os
import sys
import django
from django.core.mail import send_mail
from django.conf import settings

# Set up Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def check_email_config():
    """Verify email configuration settings"""
    print("Checking email configuration...")
    
    # Check email backend setting
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    
    # Check SMTP settings
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
        print("\nSMTP configuration:")
        print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"EMAIL_HOST_PASSWORD: {'*' * 8}")
    else:
        print("\nNot using SMTP backend")
        
    # Check default from email
    print(f"\nDEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    print("\nConfiguration check complete.")

def send_test_email(to_email):
    """Send a test email to verify configuration"""
    print(f"Sending test email to {to_email}...")
    
    try:
        # For Mailgun sandbox domains
        print("IMPORTANT NOTE: If using a Mailgun sandbox domain, the recipient must be authorized in your Mailgun account.")
        print("Visit https://app.mailgun.com/app/sending/domains to authorize recipients for sandbox domains.")
        
        subject = "Test Email from Parking System"
        message = "This is a test email to verify that the email notification system is working correctly."
        html_message = """
        <html>
        <body>
            <h2>Test Email</h2>
            <p>This is a test email to verify that the email notification system is working correctly.</p>
            <p>If you received this email, your email configuration is working!</p>
        </body>
        </html>
        """
        
        # Print more detailed information
        print(f"\nUsing email backend: {settings.EMAIL_BACKEND}")
        print(f"Sending from: {settings.DEFAULT_FROM_EMAIL}")
        print(f"Using Mailgun domain: {settings.ANYMAIL['MAILGUN_SENDER_DOMAIN']}")
        
        send_mail(
            subject=subject,
            message=message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        print("Test email sent successfully!")
    except Exception as e:
        print(f"\nError sending test email: {e}")
        print("\nTroubleshooting tips:")
        print("1. Verify your Mailgun API key is active and correctly entered in .envv file")
        print("2. If using a sandbox domain, verify the recipient email is authorized in Mailgun")
        print("3. Check that your Mailgun account is active and not suspended")
        print("4. Ensure the Mailgun domain is properly verified in your Mailgun account")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--check-config":
            check_email_config()
        elif sys.argv[1] == "--send-test-email" and len(sys.argv) > 2:
            send_test_email(sys.argv[2])
        else:
            print(__doc__)
    else:
        print(__doc__)
