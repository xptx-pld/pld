"""学校服务 - 处理学校相关数据库操作"""

from sqlalchemy.orm import Session
from app.models.school import School
from typing import Optional, List
import uuid
import logging

logger = logging.getLogger(__name__)


class SchoolService:
    """学校管理服务"""

    @staticmethod
    def get_all_active_schools(db: Session) -> List[School]:
        """获取所有激活的学校"""
        return db.query(School).filter(School.is_active == True).all()

    @staticmethod
    def get_school_by_id(db: Session, school_id: str) -> Optional[School]:
        """按学校ID获取学校"""
        return db.query(School).filter(School.school_id == school_id).first()

    @staticmethod
    def create_school(db: Session, school_name: str) -> School:
        """创建新学校"""
        school_id = f"SCH_{uuid.uuid4().hex[:8].upper()}"
        new_school = School(
            school_id=school_id,
            school_name=school_name,
            is_active=True,
        )
        db.add(new_school)
        db.commit()
        db.refresh(new_school)
        logger.info(f"新学校已创建: {school_id} - {school_name}")
        return new_school

    @staticmethod
    def update_school(db: Session, school_id: str, **kwargs) -> Optional[School]:
        """更新学校信息"""
        school = SchoolService.get_school_by_id(db, school_id)
        if not school:
            return None
        for key, value in kwargs.items():
            if hasattr(school, key):
                setattr(school, key, value)
        db.commit()
        db.refresh(school)
        logger.info(f"学校信息已更新: {school_id}")
        return school
