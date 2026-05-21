"""
Redis OTP (One-Time Password) 服务
"""

import redis.asyncio as redis
from app.config import settings
import random
import logging

logger = logging.getLogger(__name__)


class RedisOTPService:
    """Redis OTP管理服务"""

    def __init__(self):
        self.redis_url = settings.redis_url
        self.otp_ttl = settings.redis_otp_ttl  # 10分钟
        self.max_attempts = settings.redis_otp_max_attempts
        self.client = None

    async def connect(self):
        """连接Redis"""
        try:
            self.client = await redis.from_url(self.redis_url)
            await self.client.ping()
            logger.info("Redis连接成功")
        except Exception as e:
            logger.error(f"Redis连接失败: {str(e)}")
            raise

    async def disconnect(self):
        """断开Redis连接"""
        if self.client:
            await self.client.close()

    async def generate_and_store_otp(self, target: str, target_type: str = "email") -> str:
        """
        生成并存储OTP

        Args:
            target: 目标（邮箱或电话）
            target_type: 目标类型（"email" 或 "phone"）

        Returns:
            生成的OTP码
        """
        if not self.client:
            raise RuntimeError("Redis未连接")

        # 生成6位随机OTP
        otp = str(random.randint(100000, 999999))

        # 存储OTP
        key = f"otp:{target_type}:{target}"
        await self.client.setex(key, self.otp_ttl, otp)

        # 初始化尝试计数
        attempts_key = f"otp_attempts:{target_type}:{target}"
        await self.client.setex(attempts_key, self.otp_ttl, "0")

        logger.info(f"已生成 {target_type} OTP: {target}")
        return otp

    async def verify_otp(self, target: str, otp: str, target_type: str = "email") -> bool:
        """
        验证OTP

        Args:
            target: 目标（邮箱或电话）
            otp: 待验证的OTP码
            target_type: 目标类型（"email" 或 "phone"）

        Returns:
            验证成功返回True
        """
        if not self.client:
            raise RuntimeError("Redis未连接")

        key = f"otp:{target_type}:{target}"
        stored_otp = await self.client.get(key)

        # 检查是否超过尝试次数
        attempts_key = f"otp_attempts:{target_type}:{target}"
        attempts = int(await self.client.get(attempts_key) or 0)

        if attempts >= self.max_attempts:
            logger.warning(f"OTP验证失败: {target} 超过最大尝试次数")
            return False

        if not stored_otp:
            logger.warning(f"OTP验证失败: {target} OTP已过期")
            return False

        # 验证OTP
        if stored_otp.decode() != otp:
            # 增加尝试计数
            await self.client.incr(attempts_key)
            logger.warning(f"OTP验证失败: {target} OTP码不匹配")
            return False

        # 删除OTP和尝试计数
        await self.client.delete(key)
        await self.client.delete(attempts_key)

        logger.info(f"OTP验证成功: {target}")
        return True

    async def get_otp_remaining_time(self, target: str, target_type: str = "email") -> int:
        """
        获取OTP剩余有效时间

        Args:
            target: 目标（邮箱或电话）
            target_type: 目标类型（"email" 或 "phone"）

        Returns:
            剩余秒数，-1表示已过期
        """
        if not self.client:
            raise RuntimeError("Redis未连接")

        key = f"otp:{target_type}:{target}"
        ttl = await self.client.ttl(key)
        return ttl

    async def clear_otp(self, target: str, target_type: str = "email"):
        """
        清除OTP

        Args:
            target: 目标（邮箱或电话）
            target_type: 目标类型（"email" 或 "phone"）
        """
        if not self.client:
            raise RuntimeError("Redis未连接")

        key = f"otp:{target_type}:{target}"
        attempts_key = f"otp_attempts:{target_type}:{target}"
        await self.client.delete(key)
        await self.client.delete(attempts_key)

        logger.info(f"已清除 {target_type} OTP: {target}")


# 全局实例
otp_service = RedisOTPService()
