"""
初始化超级管理员账号脚本

使用方法：
    python scripts/init_admin.py --email admin@example.com --password your_password --school-id SCH_DEFAULT
"""

import argparse
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.shared import User
from app.models.school import School
from app.services.auth_service import PasswordService


def init_admin(email: str, password: str, school_id: str):
    """创建初始超级管理员账号"""
    db = SessionLocal()
    try:
        # 验证学校存在
        school = db.query(School).filter(School.school_id == school_id).first()
        if not school:
            print(f"错误：学校 {school_id} 不存在，请先运行 seed_schools.py")
            return

        # 检查是否已存在
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.role = "super_admin"
            existing.school_id = school_id
            db.commit()
            print(f"用户 {email} 已被设为超级管理员 (学校: {school.school_name})")
            return

        # 创建新超级管理员
        user_id = f"ADMIN_{email.split('@')[0].upper()}"
        admin = User(
            user_id=user_id,
            school_id=school_id,
            username=f"管理员_{email.split('@')[0]}",
            email=email,
            password_hash=PasswordService.hash_password(password),
            role="super_admin",
            is_email_verified=True,
            credit_score=100,
        )
        db.add(admin)
        db.commit()
        print(f"超级管理员账号创建成功：{email} (user_id: {user_id}, 学校: {school.school_name})")

    except Exception as e:
        db.rollback()
        print(f"创建失败：{e}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="初始化超级管理员账号")
    parser.add_argument("--email", required=True, help="管理员邮箱")
    parser.add_argument("--password", required=True, help="管理员密码")
    parser.add_argument("--school-id", required=True, help="学校ID")
    args = parser.parse_args()

    # 确保数据库表存在
    Base.metadata.create_all(bind=engine)

    init_admin(args.email, args.password, args.school_id)
