"""共享 FastAPI 依赖 - 认证与权限"""

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.shared import User
from app.services.auth_service import JWTService


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """获取当前认证用户"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证信息",
        )

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证信息",
        )

    user_id = JWTService.extract_user_id(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token无效或已过期",
        )

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被封禁",
        )

    return user


def get_current_school_admin(
    user: User = Depends(get_current_user),
) -> User:
    """获取当前学校管理员（school_admin 或 super_admin）"""
    if user.role not in ("school_admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要管理员权限",
        )
    return user


def get_current_super_admin(
    user: User = Depends(get_current_user),
) -> User:
    """获取当前超级管理员"""
    if user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要超级管理员权限",
        )
    return user
