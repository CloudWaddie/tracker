import sys
import os
import asyncio

# Fix for Windows asyncio subprocess support
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Add project root to sys.path to allow 'from backend import ...'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from backend import models, crud, database
from backend.engine import TrackerEngine
from backend import scheduler
import logging
import email.utils

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Tracker API", version="0.1.0")

# Security
ADMIN_SECRET = "secret123" # TODO: Move to env var

@app.on_event("startup")
async def startup_event():
    scheduler.start_scheduler()

async def verify_admin(x_admin_key: Optional[str] = Header(None)):
    if x_admin_key != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid Admin Key")
    return x_admin_key

# CORS Setup for Frontend development
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Tracker API is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/feed")
def get_rss_feed(db: Session = Depends(database.get_db)):
    trackers = crud.get_trackers(db, limit=100)
    
    xml = '<?xml version="1.0" encoding="UTF-8" ?>'
    xml += '<rss version="2.0">'
    xml += '<channel>'
    xml += '<title>Tracker Status Feed</title>'
    xml += '<link>http://localhost:5173</link>'
    xml += '<description>Latest status updates from Tracker</description>'
    
    for tracker in trackers:
        status = tracker.last_run_status or "pending"
        # Convert date to RFC 822 format
        pub_date = email.utils.format_datetime(tracker.last_run_at) if tracker.last_run_at else email.utils.formatdate(usegmt=True)
        
        xml += '<item>'
        xml += f'<title>{tracker.name}: {status.upper()}</title>'
        xml += f'<description>Status: {status}. Checked at: {tracker.last_run_at}</description>'
        xml += f'<guid>{tracker.id}-{tracker.last_run_at}</guid>'
        xml += f'<pubDate>{pub_date}</pubDate>'
        xml += '</item>'
        
    xml += '</channel>'
    xml += '</rss>'
    
    return Response(content=xml, media_type="application/rss+xml")

@app.post("/trackers/", response_model=models.Tracker)
def create_tracker(tracker: models.TrackerCreate, db: Session = Depends(database.get_db), admin_auth: str = Depends(verify_admin)):
    new_tracker = crud.create_tracker(db=db, tracker=tracker)
    if new_tracker.schedule_cron and new_tracker.is_active:
        scheduler.add_job(new_tracker.id, new_tracker.schedule_cron)
    return new_tracker

@app.put("/trackers/{tracker_id}", response_model=models.Tracker)
def update_tracker(tracker_id: int, tracker: models.TrackerCreate, db: Session = Depends(database.get_db), admin_auth: str = Depends(verify_admin)):
    db_tracker = crud.get_tracker(db, tracker_id=tracker_id)
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    updated_tracker = crud.update_tracker(db=db, tracker_id=tracker_id, tracker_update=tracker)
    
    # Update scheduler
    scheduler.remove_job(tracker_id)
    if updated_tracker.schedule_cron and updated_tracker.is_active:
        scheduler.add_job(updated_tracker.id, updated_tracker.schedule_cron)
        
    return updated_tracker

@app.get("/trackers/", response_model=List[models.Tracker])
def read_trackers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    trackers = crud.get_trackers(db, skip=skip, limit=limit)
    return trackers

@app.get("/trackers/{tracker_id}", response_model=models.Tracker)
def read_tracker(tracker_id: int, db: Session = Depends(database.get_db)):
    db_tracker = crud.get_tracker(db, tracker_id=tracker_id)
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")
    return db_tracker

async def execute_tracker_task(tracker_id: int):
    # Create a new session for the background task
    db = database.SessionLocal()
    try:
        tracker = crud.get_tracker(db, tracker_id)
        if not tracker:
            logger.error(f"Tracker {tracker_id} not found during execution")
            return

        crud.update_tracker_status(db, tracker_id, "running")
        
        engine = TrackerEngine()
        try:
            logs, run_info = await engine.execute_tracker(tracker.config)
            crud.update_tracker_status(db, tracker_id, "success", logs, run_info)
        except Exception as e:
            logger.error(f"Tracker {tracker_id} failed: {e}")
            # Try to get logs even on failure? engine.execute_tracker raises Exception, so logs are lost if we don't catch inside
            # Ideally engine should return logs + status or raise with logs attached.
            # For now, we only get logs on success or partial logs if we refactor engine. 
            # Given engine raises, we miss logs.
            # Let's simple pass the exception message as log for now.
            crud.update_tracker_status(db, tracker_id, "failure", str(e))
    finally:
        db.close()

@app.post("/trackers/{tracker_id}/run")
async def run_tracker(tracker_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), admin_auth: str = Depends(verify_admin)):
    db_tracker = crud.get_tracker(db, tracker_id=tracker_id)
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    background_tasks.add_task(execute_tracker_task, tracker_id)
    return {"message": "Tracker execution started"}
