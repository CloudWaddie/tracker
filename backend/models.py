import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from backend.database import Base
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

# SQLAlchemy Models
class TrackerModel(Base):
    __tablename__ = "trackers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    config = Column(JSON) # Stores the building blocks/steps
    schedule_cron = Column(String, nullable=True) # Cron expression
    last_run_status = Column(String, nullable=True) # 'success', 'failure'
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    last_run_logs = Column(Text, nullable=True) # Store logs as a simple text block or JSON
    last_run_info = Column(JSON, nullable=True) # Structured run data (counts, extracted vars)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic Schemas
class TrackerBase(BaseModel):
    name: str
    description: Optional[str] = None
    config: List[Dict[str, Any]] # List of steps
    schedule_cron: Optional[str] = None
    is_active: bool = True

class TrackerCreate(TrackerBase):
    pass

class Tracker(TrackerBase):
    id: int
    last_run_status: Optional[str] = None
    last_run_at: Optional[datetime] = None
    last_run_logs: Optional[str] = None
    last_run_info: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        orm_mode = True
