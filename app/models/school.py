"""学校模型"""

from sqlalchemy import Column, String, Boolean
from app.database import Base
from app.models.shared import TimestampMixin


class School(Base, TimestampMixin):
    """学校模型"""
    __tablename__ = "schools"

    school_id = Column(String(50), primary_key=True, index=True)
    school_name = Column(String(200), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
