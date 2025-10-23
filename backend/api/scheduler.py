"""
APScheduler Configuration for Background Tasks
Handles scheduling of automated tasks like long-stay detection
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None


def start_scheduler():
    """Initialize and start the APScheduler"""
    global scheduler
    
    if scheduler is not None:
        logger.warning("Scheduler already running")
        return
    
    scheduler = BackgroundScheduler(
        timezone='UTC',
        job_defaults={
            'coalesce': True,  # Combine missed executions
            'max_instances': 1,  # Only one instance of each job at a time
            'misfire_grace_time': 300  # 5 minutes grace period
        }
    )
    
    # Import task functions
    from .long_stay_detection import detect_long_stay_vehicles
    
    # Schedule long-stay detection - runs every hour
    scheduler.add_job(
        detect_long_stay_vehicles,
        trigger=IntervalTrigger(hours=1),
        id='long_stay_detection',
        name='Detect Long-Stay Vehicles',
        replace_existing=True,
        max_instances=1
    )
    
    # Schedule long-stay detection - also run at specific times daily
    scheduler.add_job(
        detect_long_stay_vehicles,
        trigger=CronTrigger(hour='8,12,16,20', minute=0),  # 8 AM, 12 PM, 4 PM, 8 PM
        id='long_stay_detection_scheduled',
        name='Scheduled Long-Stay Detection',
        replace_existing=True
    )
    
    # Optional: Schedule booking reminders if tasks.py exists
    try:
        from .tasks import send_booking_reminders
        scheduler.add_job(
            send_booking_reminders,
            trigger=IntervalTrigger(minutes=5),
            id='booking_reminders',
            name='Send Booking Reminders',
            replace_existing=True
        )
    except ImportError:
        logger.info("Booking reminders task not found, skipping")
    
    # Start the scheduler
    scheduler.start()
    logger.info("✅ APScheduler started successfully")
    logger.info(f"Scheduled jobs: {[job.id for job in scheduler.get_jobs()]}")


def stop_scheduler():
    """Gracefully stop the scheduler"""
    global scheduler
    if scheduler is not None:
        scheduler.shutdown(wait=True)
        scheduler = None
        logger.info("APScheduler stopped")


def get_scheduler():
    """Get the scheduler instance"""
    return scheduler
