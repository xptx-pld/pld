"""
认证服务 - 包括密码哈希、JWT token生成和验证
"""

import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class PasswordService:
    """密码服务 - 哈希和验证"""

    @staticmethod
    def hash_password(password: str) -> str:
        """
        对密码进行哈希处理

        Args:
            password: 明文密码

        Returns:
            哈希后的密码
        """
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """
        验证密码是否正确

        Args:
            password: 待验证的明文密码
            password_hash: 存储的哈希密码

        Returns:
            密码正确返回True
        """
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception as e:
            logger.error(f"密码验证失败: {str(e)}")
            return False


class JWTService:
    """JWT token服务"""

    @staticmethod
    def generate_tokens(
        user_id: str,
        username: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        生成access token和refresh token

        Args:
            user_id: 用户ID
            username: 用户名
            email: 邮箱（可选）
            phone: 电话（可选）

        Returns:
            包含access_token、refresh_token和过期时间的字典
        """
        try:
            now = datetime.now(timezone.utc)

            # 生成Access Token
            access_token_payload = {
                'user_id': user_id,
                'username': username,
                'email': email,
                'phone': phone,
                'type': 'access',
                'iat': now,
                'exp': now + timedelta(hours=settings.jwt_expiration_hours),
            }
            access_token = jwt.encode(
                access_token_payload,
                settings.jwt_secret_key,
                algorithm=settings.jwt_algorithm
            )

            # 生成Refresh Token
            refresh_token_payload = {
                'user_id': user_id,
                'type': 'refresh',
                'iat': now,
                'exp': now + timedelta(days=settings.refresh_token_expiration_days),
            }
            refresh_token = jwt.encode(
                refresh_token_payload,
                settings.jwt_secret_key,
                algorithm=settings.jwt_algorithm
            )

            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'bearer',
                'expires_in': settings.jwt_expiration_hours * 3600,
                'user_id': user_id,
                'username': username,
            }

        except Exception as e:
            logger.error(f"生成token失败: {str(e)}")
            raise

    @staticmethod
    def verify_token(token: str, token_type: str = 'access') -> Optional[Dict[str, Any]]:
        """
        验证JWT token

        Args:
            token: 待验证的token
            token_type: token类型（'access' 或 'refresh'）

        Returns:
            token有效返回payload，否则返回None
        """
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )

            # 验证token类型
            if payload.get('type') != token_type:
                logger.warning(f"Token类型不匹配: 期望 {token_type}，实际 {payload.get('type')}")
                return None

            return payload

        except jwt.ExpiredSignatureError:
            logger.warning(f"Token已过期")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"无效的Token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"验证token失败: {str(e)}")
            return None

    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        使用refresh token生成新的access token

        Args:
            refresh_token: refresh token

        Returns:
            新的tokens字典，或None表示失败
        """
        payload = JWTService.verify_token(refresh_token, token_type='refresh')

        if not payload:
            logger.warning("Refresh token验证失败")
            return None

        # 使用refresh token中的信息生成新的access token
        return JWTService.generate_tokens(
            user_id=payload['user_id'],
            username=payload.get('username', ''),
        )

    @staticmethod
    def extract_user_id(token: str) -> Optional[str]:
        """
        从token中提取user_id

        Args:
            token: JWT token

        Returns:
            user_id或None
        """
        payload = JWTService.verify_token(token)
        if payload:
            return payload.get('user_id')
        return None
