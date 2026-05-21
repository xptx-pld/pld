"""
Shared database models and base classes.
"""

from sqlalchemy import Column, String, Integer, DateTime, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from app.database import Base


class TimestampMixin:
    """时间戳混入类"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class User(Base, TimestampMixin):
    """用户模型"""
    __tablename__ = "users"

    user_id = Column(String(50), primary_key=True, index=True)
    room_id = Column(String(50), index=True, nullable=True)
    username = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=True, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    credit_score = Column(Integer, default=100)  # 信用积分
    voting_weight_modifier = Column(Float, default=1.0)  # 投票权重修正器


class Room(Base, TimestampMixin):
    """房间模型"""
    __tablename__ = "rooms"

    room_id = Column(String(50), primary_key=True, index=True)
    room_name = Column(String(100), nullable=False)
    capacity = Column(Integer, default=4)
    current_cycle = Column(String(50), nullable=True)  # 当前周期ID


class Preference(Base, TimestampMixin):
    """用户偏好模型"""
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), index=True)
    room_id = Column(String(50), index=True)
    sleep_time = Column(String(5), nullable=True)  # HH:mm format
    ac_temp_preference = Column(Integer, nullable=True)  # 摄氏度
    noise_tolerance_level = Column(Integer, nullable=True)  # 1-5
    preference_type = Column(String(20), default="explicit")  # explicit or implicit


class IoTData(Base, TimestampMixin):
    """IoT设备数据模型"""
    __tablename__ = "iot_data"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(50), index=True)
    device_type = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    value = Column(String(255), nullable=True)
    operator_id = Column(String(50), nullable=True)
    event_timestamp = Column(DateTime, nullable=False)


class Violation(Base, TimestampMixin):
    """违约事件模型"""
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(50), index=True)
    violator_id = Column(String(50), index=True)
    rule_type = Column(String(50), nullable=False)
    evidence_log = Column(Text, nullable=False)
    deducted_points = Column(Integer, nullable=False)
    is_processed = Column(Boolean, default=False)


class CovenanPlan(Base, TimestampMixin):
    """寝室公约方案模型"""
    __tablename__ = "covenant_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String(50), unique=True, index=True)
    room_id = Column(String(50), index=True)
    plan_type = Column(String(50), nullable=False)  # nash, kalai_smorodinsky, custom
    plan_details = Column(Text, nullable=False)  # JSON format
    status = Column(String(20), default="active")  # active, archived
    voting_ids = Column(Text, nullable=True)  # JSON array


class GovernanceRevision(Base, TimestampMixin):
    """治理周期修订模型"""
    __tablename__ = "governance_revisions"

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(String(50), unique=True, index=True)
    room_id = Column(String(50), index=True)
    cycle_number = Column(Integer, nullable=False)
    status = Column(String(20), default="active")  # active, completed
    execution_report = Column(Text, nullable=True)  # JSON format
    vote_session_id = Column(String(50), nullable=True)


class UserHabit(Base, TimestampMixin):
    """用户习惯模型"""
    __tablename__ = "user_habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), unique=True, index=True)
    sleep_time = Column(String(20), nullable=True)  # 睡觉时间
    wake_time = Column(String(20), nullable=True)  # 起床时间
    nap_habit = Column(Boolean, default=False)  # 午休习惯
    stay_up_late = Column(Boolean, default=False)  # 经常熬夜
    cleanliness = Column(String(20), nullable=True)  # 打扫频率
    clean_level = Column(Integer, default=3)  # 整洁度要求 1-5
    temp_preference = Column(String(10), nullable=True)  # 温度偏好
    window_ventilation = Column(Boolean, default=False)  # 喜欢开窗
    light_preference = Column(String(20), nullable=True)  # 照明偏好
    noise_sensitivity = Column(String(20), nullable=True)  # 噪音敏感度
    use_headphones = Column(Boolean, default=False)  # 戴耳机
    game_video_sound = Column(Boolean, default=False)  # 游戏视频外放
    personality = Column(String(10), nullable=True)  # 性格
    bring_friends = Column(String(10), nullable=True)  # 带朋友频率
    smoking = Column(Boolean, default=False)  # 抽烟
    snoring = Column(Boolean, default=False)  # 打呼噜
    study_location = Column(String(20), nullable=True)  # 学习地点
    special_schedule = Column(Text, nullable=True)  # 特殊作息说明
    quiet_study = Column(Boolean, default=False)  # 需要安静备考
