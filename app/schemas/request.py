"""
Request and Response data models (Pydantic schemas).
"""

from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re


# ==================== 认证模块 ====================

class RegisterEmailRequest(BaseModel):
    """邮箱注册请求"""
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fff]+$', v):
            raise ValueError('用户名只能包含字母、数字、下划线和中文')
        return v


class RegisterPhoneRequest(BaseModel):
    """电话注册请求"""
    phone: str = Field(..., pattern=r'^1[3-9]\d{9}$')  # 中国手机号
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)


class SendEmailOTPRequest(BaseModel):
    """发送邮箱OTP请求"""
    email: EmailStr


class SendPhoneOTPRequest(BaseModel):
    """发送电话OTP请求"""
    phone: str = Field(..., pattern=r'^1[3-9]\d{9}$')


class VerifyEmailOTPRequest(BaseModel):
    """验证邮箱OTP请求"""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=6)


class VerifyPhoneOTPRequest(BaseModel):
    """验证电话OTP请求"""
    phone: str = Field(..., pattern=r'^1[3-9]\d{9}$')
    otp: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=6)


class LoginEmailRequest(BaseModel):
    """邮箱登录请求"""
    email: EmailStr
    password: str


class LoginPhoneRequest(BaseModel):
    """电话登录请求"""
    phone: str = Field(..., pattern=r'^1[3-9]\d{9}$')
    password: str


class RefreshTokenRequest(BaseModel):
    """刷新Token请求"""
    refresh_token: str


class TokenResponse(BaseModel):
    """Token响应"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    username: str


class UserProfileResponse(BaseModel):
    """用户资料响应"""
    user_id: str
    username: str
    email: Optional[str]
    phone: Optional[str]
    credit_score: int
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime


class OTPResponse(BaseModel):
    """OTP发送响应"""
    message: str
    target: str  # email or phone
    resend_in: int  # 秒数


# ==================== 模块一：行为洞察模块 ====================

class ExplicitPreferenceRequest(BaseModel):
    """提交显式偏好 - 请求"""
    user_id: str
    room_id: str
    sleep_time: str  # HH:mm format
    ac_temp_preference: int
    noise_tolerance_level: int  # 1-5


class IoTWebhookRequest(BaseModel):
    """IoT数据上报 - 请求"""
    room_id: str
    device_type: str  # SMART_AC, SMART_PLUG, CHAT_METRIC
    action: str
    value: Any
    operator_id: Optional[str] = None
    timestamp: str  # ISO 8601 format


class ContrastReportResponse(BaseModel):
    """对比报告 - 响应数据"""
    user_id: str
    explicit_profile: Dict[str, Any]
    implicit_profile: Dict[str, Any]
    conflict_tags: List[str]
    conclusion: str


class ConflictPredictionResponse(BaseModel):
    """冲突预警 - 响应数据"""
    room_id: str
    warning_level: str  # LOW, MEDIUM, HIGH
    probability: float
    trigger_factors: List[str]
    prediction_message: str


# ==================== 模块二：博弈论模块 ====================

class SatisfactionPoint(BaseModel):
    """帕累托前沿点"""
    plan_id: str
    satisfaction_vector: List[float]
    details: Dict[str, Any]


class ParetoFrontierResponse(BaseModel):
    """帕累托前沿 - 响应数据"""
    room_id: str
    dimensions: List[str]
    points: List[SatisfactionPoint]


class NashSolution(BaseModel):
    """纳什解"""
    plan_id: str
    mathematical_basis: str
    description: str
    details: Dict[str, Any]


class KalaiSmarodinskySolution(BaseModel):
    """卡莱-斯莫罗丁斯基解"""
    plan_id: str
    mathematical_basis: str
    description: str
    details: Dict[str, Any]


class OptimalSolutionsResponse(BaseModel):
    """最优解 - 响应数据"""
    room_id: str
    nash_solution: NashSolution
    kalai_smorodinsky_solution: KalaiSmarodinskySolution


class CommitPlanRequest(BaseModel):
    """提交最终协商方案 - 请求"""
    room_id: str
    chosen_plan_id: str
    custom_adjustment: Optional[Dict[str, Any]] = None
    agreed_user_ids: List[str]


class CommitPlanResponse(BaseModel):
    """提交最终协商方案 - 响应数据"""
    room_id: str
    covenant_plan_id: int
    status: str
    created_at: datetime


# ==================== 模块三：治理自治模块 ====================

class IoTRule(BaseModel):
    """IoT规则"""
    rule_id: str
    target_device: str
    cron_expression: str
    execution_action: str
    payload: Dict[str, Any]


class SyncIoTRulesRequest(BaseModel):
    """同步IoT规则 - 请求"""
    room_id: str
    rules: List[IoTRule]


class ViolationRequest(BaseModel):
    """违约事件 - 请求"""
    room_id: str
    violator_id: str
    rule_type: str  # LIGHTS_OFF, AC_TEMP, NOISE
    evidence_log: str


class ViolationResponse(BaseModel):
    """违约事件 - 响应数据"""
    user_id: str
    deducted_points: int
    remaining_credit_score: int
    voting_weight_modifier: float
    broadcast_notice: str


class InitiateRevisionResponse(BaseModel):
    """发起新一轮公约迭代 - 响应数据"""
    room_id: str
    cycle_id: str
    execution_report: Dict[str, Any]
    vote_session_id: str
    status: str


class NVCRequest(BaseModel):
    """NVC调解生成 - 请求"""
    room_id: str
    conflict_type: str  # LIGHT_AND_NOISE, AC_TEMPERATURE, etc.
    involved_parties: List[str]
    recent_friction_count: int


class NVCResponse(BaseModel):
    """NVC调解生成 - 响应数据"""
    room_id: str
    mediation_narrative: str
    suggested_transitional_plan: Dict[str, Any]


# ==================== 通用响应类型 ====================

class StandardResponse(BaseModel):
    """标准响应包装"""
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None
