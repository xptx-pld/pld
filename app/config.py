"""
Application configuration management.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用程序设置"""

    # Database Configuration
    database_url: str = "mysql+mysqlconnector://root:password@localhost:3306/dormitory_autonomy_db"

    # Server Configuration
    server_host: str = "0.0.0.0"
    server_port: int = 8000
    debug: bool = True

    # Application Settings
    api_version: str = "v1"
    app_name: str = "Dormitory Autonomy System"

    # ===================== 认证配置 =====================
    # JWT配置
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    refresh_token_expiration_days: int = 7

    # Redis配置
    redis_url: str = "redis://localhost:6379/0"
    redis_otp_ttl: int = 600  # OTP有效期：10分钟
    redis_otp_max_attempts: int = 5  # 最多尝试次数

    # 邮件配置
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 465
    smtp_username: str = ""  # 从.env读取
    smtp_password: str = ""  # 从.env读取
    sender_email: str = ""  # 从.env读取
    sender_name: str = "寝室自治系统"

    # 电话号码配置
    phone_prefix: str = "+86"  # 国家代码

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

