"""
Application constants and enumerations.
"""

from enum import Enum


class DeviceType(str, Enum):
    """IoT设备类型"""
    SMART_AC = "SMART_AC"
    SMART_PLUG = "SMART_PLUG"
    CHAT_METRIC = "CHAT_METRIC"


class ActionType(str, Enum):
    """设备动作类型"""
    TEMP_CHANGE = "TEMP_CHANGE"
    POWER_TOGGLE = "POWER_TOGGLE"
    HIGH_FREQUENCY_CHAT = "HIGH_FREQUENCY_CHAT"


class NoiseToleranceLevel(int, Enum):
    """噪音耐受度等级 (1-5)"""
    VERY_LOW = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    VERY_HIGH = 5


class WarningLevel(str, Enum):
    """冲突预警等级"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RuleType(str, Enum):
    """违约规则类型"""
    LIGHTS_OFF = "LIGHTS_OFF"
    AC_TEMP = "AC_TEMP"
    NOISE = "NOISE"


class ConflictType(str, Enum):
    """冲突类型"""
    LIGHT_AND_NOISE = "LIGHT_AND_NOISE"
    AC_TEMPERATURE = "AC_TEMPERATURE"
    SCHEDULE_MISMATCH = "SCHEDULE_MISMATCH"
    GENERAL = "GENERAL"


class ExecutionAction(str, Enum):
    """IoT执行动作"""
    SET_MODE = "SET_MODE"
    SET_TEMPERATURE = "SET_TEMPERATURE"
    TRANSFER_CONTROL_AUTHORITY = "TRANSFER_CONTROL_AUTHORITY"
    POWER_OFF = "POWER_OFF"


# 违约信用扣分规则
VIOLATION_DEDUCTION_RULES = {
    RuleType.LIGHTS_OFF: 5,
    RuleType.AC_TEMP: 3,
    RuleType.NOISE: 4,
}

# 基础信用分
BASE_CREDIT_SCORE = 100

# 预警概率阈值
CONFLICT_PREDICTION_THRESHOLD = 0.5
