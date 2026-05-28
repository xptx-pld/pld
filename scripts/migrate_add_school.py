"""
数据迁移脚本 - 为现有用户和房间添加 school_id

使用方法：
    python scripts/migrate_add_school.py
    python scripts/migrate_add_school.py --default-school-id SCH_DEFAULT
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.shared import User, Room
from app.models.school import School
from sqlalchemy import text


def migrate(default_school_id: str):
    """为现有数据添加 school_id"""
    db = SessionLocal()
    try:
        # 1. 确保 schools 表存在
        School.__table__.create(bind=engine, checkfirst=True)
        print("schools 表已就绪")

        # 2. 确保默认学校存在
        default_school = db.query(School).filter(School.school_id == default_school_id).first()
        if not default_school:
            default_school = School(
                school_id=default_school_id,
                school_name="默认学校",
                is_active=True,
            )
            db.add(default_school)
            db.commit()
            print(f"已创建默认学校: {default_school_id}")

        # 3. 检查 users 表是否有 school_id 列
        try:
            db.execute(text("SELECT school_id FROM users LIMIT 1"))
            print("users 表已有 school_id 列")
        except Exception:
            print("正在为 users 表添加 school_id 列...")
            db.execute(text(f"ALTER TABLE users ADD COLUMN school_id VARCHAR(50) NOT NULL DEFAULT '{default_school_id}'"))
            db.execute(text("CREATE INDEX ix_users_school_id ON users (school_id)"))
            db.commit()
            print("users 表 school_id 列已添加")

        # 4. 检查 rooms 表是否有 school_id 列
        try:
            db.execute(text("SELECT school_id FROM rooms LIMIT 1"))
            print("rooms 表已有 school_id 列")
        except Exception:
            print("正在为 rooms 表添加 school_id 列...")
            db.execute(text(f"ALTER TABLE rooms ADD COLUMN school_id VARCHAR(50) NOT NULL DEFAULT '{default_school_id}'"))
            db.execute(text("CREATE INDEX ix_rooms_school_id ON rooms (school_id)"))
            db.commit()
            print("rooms 表 school_id 列已添加")

        # 5. 更新现有数据中为空的 school_id
        users_updated = db.execute(text(f"UPDATE users SET school_id = '{default_school_id}' WHERE school_id IS NULL OR school_id = ''")).rowcount
        rooms_updated = db.execute(text(f"UPDATE rooms SET school_id = '{default_school_id}' WHERE school_id IS NULL OR school_id = ''")).rowcount
        db.commit()

        if users_updated or rooms_updated:
            print(f"已更新 {users_updated} 个用户和 {rooms_updated} 个房间的 school_id")

        # 6. 更新 user role: admin -> super_admin
        admins_updated = db.execute(text("UPDATE users SET role = 'super_admin' WHERE role = 'admin'")).rowcount
        db.commit()
        if admins_updated:
            print(f"已将 {admins_updated} 个 admin 角色更新为 super_admin")

        print("\n数据迁移完成！")

    except Exception as e:
        db.rollback()
        print(f"迁移失败：{e}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="数据迁移：添加多学校支持")
    parser.add_argument("--default-school-id", default="SCH_DEFAULT", help="默认学校ID")
    args = parser.parse_args()

    # 确保基础表存在
    Base.metadata.create_all(bind=engine)

    migrate(args.default_school_id)
