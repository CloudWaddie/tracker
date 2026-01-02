from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from backend import models, crud, database
from backend.engine import TrackerEngine
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def run_tracker_job(tracker_id: int):
    logger.info(f"Running scheduled job for tracker {tracker_id}")
    # We need to manually handle the DB session here
    db = database.SessionLocal()
    try:
        tracker = crud.get_tracker(db, tracker_id)
        if not tracker or not tracker.is_active:
            logger.info(f"Tracker {tracker_id} is inactive or deleted, skipping.")
            return

        crud.update_tracker_status(db, tracker_id, "running")
        
        engine = TrackerEngine()
        try:
            logs, run_info = await engine.execute_tracker(tracker.config)
            crud.update_tracker_status(db, tracker_id, "success", logs, run_info)
        except Exception as e:
            logger.error(f"Tracker {tracker_id} failed: {e}")
            crud.update_tracker_status(db, tracker_id, "failure", str(e))
    finally:
        db.close()

def start_scheduler():
    scheduler.start()
    logger.info("Scheduler started")
    # Load existing schedules
    db = database.SessionLocal()
    try:
        trackers = crud.get_trackers(db, limit=1000)
        for tracker in trackers:
            if tracker.schedule_cron and tracker.is_active:
                add_job(tracker.id, tracker.schedule_cron)
    finally:
        db.close()

def add_job(tracker_id: int, cron_expression: str):
    # cron_expression expected in standard 5-part format: "min hour day month day_of_week"
    # APScheduler CronTrigger is flexible.
    try:
        scheduler.add_job(
            run_tracker_job,
            CronTrigger.from_crontab(cron_expression),
            id=str(tracker_id),
            replace_existing=True,
            args=[tracker_id]
        )
        logger.info(f"Added job for tracker {tracker_id} with cron: {cron_expression}")
    except Exception as e:
        logger.error(f"Failed to add job for tracker {tracker_id}: {e}")

def remove_job(tracker_id: int):
    try:
        scheduler.remove_job(str(tracker_id))
        logger.info(f"Removed job for tracker {tracker_id}")
    except Exception:
        pass # Job might not exist
