"""
OTP (One-Time Password) 服务
支持Redis存储和内存回退（开发环境）
"""

import redis.asyncio as redis
from app.config import settings
import random
import time
import logging

logger = logging.getLogger(__name__)


class InMemoryOTPService:
    """内存OTP服务（开发环境回退方案）"""

    def __init__(self):
        self.otp_ttl = settings.redis_otp_ttl
        self.max_attempts = settings.redis_otp_max_attempts
        self._store: dict[str, tuple[str, float]] = {}  # key -> (otp, expire_timestamp)
        self._attempts: dict[str, tuple[int, float]] = {}  # key -> (count, expire_timestamp)

    def _key(self, target_type: str, target: str) -> str:
        return f"{target_type}:{target}"

    async def connect(self):
        logger.warning("Redis不可用，使用内存存储OTP（仅适用于开发环境）")

    async def disconnect(self):
        self._store.clear()
        self._attempts.clear()

    def _cleanup(self, key: str):
        now = time.time()
        if key in self._store and self._store[key][1] < now:
            del self._store[key]
        if key in self._attempts and self._attempts[key][1] < now:
            del self._attempts[key]

    async def generate_and_store_otp(self, target: str, target_type: str = "email") -> str:
        otp = str(random.randint(100000, 999999))
        key = self._key(target_type, target)
        expire = time.time() + self.otp_ttl
        self._store[key] = (otp, expire)
        self._attempts[key] = (0, expire)
        logger.info(f"已生成 {target_type} OTP（内存）: {target}")
        return otp

    async def verify_otp(self, target: str, otp: str, target_type: str = "email") -> bool:
        key = self._key(target_type, target)
        self._cleanup(key)

        if key not in self._store:
            logger.warning(f"OTP验证失败: {target} OTP已过期")
            return False

        attempts_count, attempts_expire = self._attempts.get(key, (0, 0))
        if attempts_count >= self.max_attempts:
            logger.warning(f"OTP验证失败: {target} 超过最大尝试次数")
            return False

        stored_otp, _ = self._store[key]
        if stored_otp != otp:
            self._attempts[key] = (attempts_count + 1, attempts_expire)
            logger.warning(f"OTP验证失败: {target} OTP码不匹配")
            return False

        del self._store[key]
        if key in self._attempts:
            del self._attempts[key]
        logger.info(f"OTP验证成功: {target}")
        return True

    async def get_otp_remaining_time(self, target: str, target_type: str = "email") -> int:
        key = self._key(target_type, target)
        if key not in self._store:
            return -1
        remaining = int(self._store[key][1] - time.time())
        return max(remaining, -1)

    async def clear_otp(self, target: str, target_type: str = "email"):
        key = self._key(target_type, target)
        self._store.pop(key, None)
        self._attempts.pop(key, None)
        logger.info(f"已清除 {target_type} OTP（内存）: {target}")


class RedisOTPService:
    """Redis OTP管理服务"""

    def __init__(self):
        self.redis_url = settings.redis_url
        self.otp_ttl = settings.redis_otp_ttl
        self.max_attempts = settings.redis_otp_max_attempts
        self.client = None

    async def connect(self):
        try:
            self.client = await redis.from_url(self.redis_url)
            await self.client.ping()
            logger.info("Redis连接成功")
        except Exception as e:
            logger.error(f"Redis连接失败: {str(e)}")
            raise

    async def disconnect(self):
        if self.client:
            await self.client.close()

    async def generate_and_store_otp(self, target: str, target_type: str = "email") -> str:
        if not self.client:
            raise RuntimeError("Redis未连接")

        otp = str(random.randint(100000, 999999))
        key = f"otp:{target_type}:{target}"
        await self.client.setex(key, self.otp_ttl, otp)
        attempts_key = f"otp_attempts:{target_type}:{target}"
        await self.client.setex(attempts_key, self.otp_ttl, "0")
        logger.info(f"已生成 {target_type} OTP: {target}")
        return otp

    async def verify_otp(self, target: str, otp: str, target_type: str = "email") -> bool:
        if not self.client:
            raise RuntimeError("Redis未连接")

        key = f"otp:{target_type}:{target}"
        stored_otp = await self.client.get(key)
        attempts_key = f"otp_attempts:{target_type}:{target}"
        attempts = int(await self.client.get(attempts_key) or 0)

        if attempts >= self.max_attempts:
            logger.warning(f"OTP验证失败: {target} 超过最大尝试次数")
            return False

        if not stored_otp:
            logger.warning(f"OTP验证失败: {target} OTP已过期")
            return False

        if stored_otp.decode() != otp:
            await self.client.incr(attempts_key)
            logger.warning(f"OTP验证失败: {target} OTP码不匹配")
            return False

        await self.client.delete(key)
        await self.client.delete(attempts_key)
        logger.info(f"OTP验证成功: {target}")
        return True

    async def get_otp_remaining_time(self, target: str, target_type: str = "email") -> int:
        if not self.client:
            raise RuntimeError("Redis未连接")
        key = f"otp:{target_type}:{target}"
        ttl = await self.client.ttl(key)
        return ttl

    async def clear_otp(self, target: str, target_type: str = "email"):
        if not self.client:
            raise RuntimeError("Redis未连接")
        key = f"otp:{target_type}:{target}"
        attempts_key = f"otp_attempts:{target_type}:{target}"
        await self.client.delete(key)
        await self.client.delete(attempts_key)
        logger.info(f"已清除 {target_type} OTP: {target}")


async def create_otp_service():
    """尝试连接Redis，失败则回退到内存存储"""
    try:
        service = RedisOTPService()
        await service.connect()
        return service
    except Exception:
        logger.warning("Redis连接失败，回退到内存OTP服务")
        service = InMemoryOTPService()
        await service.connect()
        return service


# 全局实例（延迟初始化）
otp_service = None


async def get_otp_service():
    global otp_service
    if otp_service is None:
        otp_service = await create_otp_service()
    return otp_service
