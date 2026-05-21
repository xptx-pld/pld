"""
用户服务 - 处理用户数据库操作
"""

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.shared import User
from app.services.auth_service import PasswordService
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)


class UserService:
    """用户管理服务"""

    @staticmethod
    def create_user(
        db: Session,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        username: str = None,
        password: str = None,
    ) -> User:
        """
        创建新用户

        Args:
            db: 数据库session
            email: 邮箱
            phone: 电话
            username: 用户名
            password: 密码（将被哈希）

        Returns:
            创建的User对象
        """
        # 生成唯一user_id
        user_id = str(uuid.uuid4())

        # 哈希密码
        password_hash = PasswordService.hash_password(password)

        # 创建新用户
        new_user = User(
            user_id=user_id,
            email=email,
            phone=phone,
            username=username,
            password_hash=password_hash,
            is_email_verified=False,
            is_phone_verified=False,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(f"新用户已创建: {user_id}")
        return new_user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """按邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
        """按电话获取用户"""
        return db.query(User).filter(User.phone == phone).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """按用户ID获取用户"""
        return db.query(User).filter(User.user_id == user_id).first()

    @staticmethod
    def email_exists(db: Session, email: str) -> bool:
        """检查邮箱是否已存在"""
        return db.query(User).filter(User.email == email).first() is not None

    @staticmethod
    def phone_exists(db: Session, phone: str) -> bool:
        """检查电话号码是否已存在"""
        return db.query(User).filter(User.phone == phone).first() is not None

    @staticmethod
    def username_exists(db: Session, username: str) -> bool:
        """检查用户名是否已存在"""
        return db.query(User).filter(User.username == username).first() is not None

    @staticmethod
    def verify_email(db: Session, email: str) -> Optional[User]:
        """标记邮箱为已验证"""
        user = UserService.get_user_by_email(db, email)
        if user:
            user.is_email_verified = True
            db.commit()
            db.refresh(user)
            logger.info(f"邮箱已验证: {email}")
        return user

    @staticmethod
    def verify_phone(db: Session, phone: str) -> Optional[User]:
        """标记电话号码为已验证"""
        user = UserService.get_user_by_phone(db, phone)
        if user:
            user.is_phone_verified = True
            db.commit()
            db.refresh(user)
            logger.info(f"电话已验证: {phone}")
        return user

    @staticmethod
    def verify_password(db: Session, user_id: str, password: str) -> bool:
        """验证用户密码"""
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return False
        return PasswordService.verify_password(password, user.password_hash)

    @staticmethod
    def update_user(db: Session, user_id: str, **kwargs) -> Optional[User]:
        """更新用户信息"""
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return None

        for key, value in kwargs.items():
            if hasattr(user, key) and key != 'password':
                setattr(user, key, value)
            elif key == 'password':
                user.password_hash = PasswordService.hash_password(value)

        db.commit()
        db.refresh(user)
        logger.info(f"用户信息已更新: {user_id}")
        return user
