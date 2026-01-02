import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend import models
from datetime import datetime

def get_tracker(db: Session, tracker_id: int):
    return db.query(models.TrackerModel).filter(models.TrackerModel.id == tracker_id).first()

def get_trackers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TrackerModel).offset(skip).limit(limit).all()

def create_tracker(db: Session, tracker: models.TrackerCreate):
    db_tracker = models.TrackerModel(**tracker.dict())
    db.add(db_tracker)
    db.commit()
    db.refresh(db_tracker)
    return db_tracker

def delete_tracker(db: Session, tracker_id: int):
    db_tracker = db.query(models.TrackerModel).filter(models.TrackerModel.id == tracker_id).first()
    if db_tracker:
        db.delete(db_tracker)
        db.commit()
    return db_tracker

def update_tracker_status(db: Session, tracker_id: int, status: str, logs: str = None, run_info: dict = None):
    db_tracker = db.query(models.TrackerModel).filter(models.TrackerModel.id == tracker_id).first()
    if db_tracker:
        db_tracker.last_run_status = status
        db_tracker.last_run_at = datetime.utcnow()
        if logs:
            db_tracker.last_run_logs = logs
        if run_info:
            db_tracker.last_run_info = run_info
        db.commit()
        db.refresh(db_tracker)
    return db_tracker

def update_tracker(db: Session, tracker_id: int, tracker_update: models.TrackerCreate):
    db_tracker = db.query(models.TrackerModel).filter(models.TrackerModel.id == tracker_id).first()
    if db_tracker:
        db_tracker.name = tracker_update.name
        db_tracker.description = tracker_update.description
        db_tracker.config = tracker_update.config
        db_tracker.schedule_cron = tracker_update.schedule_cron
        db_tracker.is_active = tracker_update.is_active
        db.commit()
        db.refresh(db_tracker)
    return db_tracker
