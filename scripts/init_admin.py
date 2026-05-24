"""
初始化管理员账号脚本

使用方法：
    python scripts/init_admin.py --email admin@example.com --password your_password
"""

import argparse
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.shared import User
from app.services.auth_service import PasswordService


def init_admin(email: str, password: str):
    """创建初始管理员账号"""
    db = SessionLocal()
    try:
        # 检查是否已存在
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.role = "admin"
            db.commit()
            print(f"用户 {email} 已被设为管理员")
            return

        # 创建新管理员
        user_id = f"ADMIN_{email.split('@')[0].upper()}"
        admin = User(
            user_id=user_id,
            username=f"管理员_{email.split('@')[0]}",
            email=email,
            password_hash=PasswordService.hash_password(password),
            role="admin",
            is_email_verified=True,
            credit_score=100,
        )
        db.add(admin)
        db.commit()
        print(f"管理员账号创建成功：{email} (user_id: {user_id})")

    except Exception as e:
        db.rollback()
        print(f"创建失败：{e}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="初始化管理员账号")
    parser.add_argument("--email", required=True, help="管理员邮箱")
    parser.add_argument("--password", required=True, help="管理员密码")
    args = parser.parse_args()

    # 确保数据库表存在
    Base.metadata.create_all(bind=engine)

    init_admin(args.email, args.password)
