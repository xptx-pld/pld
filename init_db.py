"""
数据库初始化脚本 - 创建所有表并插入默认数据
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models.shared import *
from app.models.school import School

def init_database():
    """创建所有表"""
    print("创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("表创建完成")

    # 插入默认学校数据
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        schools = [
            {"school_id": "SCH_DEFAULT", "school_name": "默认学校"},
            {"school_id": "SCH_BJU", "school_name": "北京联合大学"},
            {"school_id": "SCH_THU", "school_name": "清华大学"},
        ]
        for s in schools:
            existing = db.query(School).filter(School.school_id == s["school_id"]).first()
            if not existing:
                db.add(School(**s, is_active=True))
        db.commit()
        print("默认数据插入完成")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
