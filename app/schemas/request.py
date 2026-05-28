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
    school_id: str = Field(..., min_length=1)

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
    school_id: str = Field(..., min_length=1)


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
    school_id: str = Field(..., min_length=1)


class VerifyPhoneOTPRequest(BaseModel):
    """验证电话OTP请求"""
    phone: str = Field(..., pattern=r'^1[3-9]\d{9}$')
    otp: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=6)
    school_id: str = Field(..., min_length=1)


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
    school_id: Optional[str] = None
    role: str = "user"


class UserProfileResponse(BaseModel):
    """用户资料响应"""
    user_id: str
    username: str
    email: Optional[str]
    phone: Optional[str]
    school_id: str
    credit_score: int
    is_email_verified: bool
    is_phone_verified: bool
    role: str = "user"
    room_id: Optional[str] = None
    created_at: datetime


class OTPResponse(BaseModel):
    """OTP发送响应"""
    message: str
    target: str  # email or phone
    resend_in: int  # 秒数


class SchoolResponse(BaseModel):
    """学校信息响应"""
    school_id: str
    school_name: str
    is_active: bool


class SchoolListResponse(BaseModel):
    """学校列表响应"""
    schools: List[SchoolResponse]
    total: int


class CreateRoomRequest(BaseModel):
    """创建寝室请求"""
    room_name: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(default=4, ge=2, le=8)


class JoinRoomRequest(BaseModel):
    """加入寝室请求"""
    room_id: str


# ==================== 模块一：行为洞察模块 ====================

class ExplicitPreferenceRequest(BaseModel):
    """提交显式偏好 - 请求"""
    user_id: str
    room_id: str
    sleep_time: str  # HH:mm format
    ac_temp_preference: int
    noise_tolerance_level: int  # 1-5


class FullPreferenceRequest(BaseModel):
    """提交完整偏好 - 请求"""
    room_id: str
    # 作息
    sleep_time: str = ''
    wake_time: str = ''
    expected_sleep_time: str = ''
    expected_wake_time: str = ''
    weekend_diff: str = ''
    alarm_habit: str = ''
    nap_habit: bool = False
    stay_up_late: bool = False
    # 卫生
    cleanliness: str = ''
    clean_level: int = 3
    shower_freq: str = ''
    clothes_wash: str = ''
    trash_duty: str = ''
    # 饮食
    meal_regularity: str = ''
    strong_food: str = ''
    delivery_freq: str = ''
    # 环境
    temp_preference: str = ''
    window_ventilation: bool = False
    light_preference: str = ''
    ac_habit: str = ''
    night_light: str = ''
    # 噪音
    noise_sensitivity: str = ''
    use_headphones: bool = False
    game_video_sound: bool = False
    video_call_tolerance: str = ''
    video_call_freq: str = ''
    # 社交
    personality: str = ''
    bring_friends: str = ''
    smoking: bool = False
    snoring: bool = False
    has_partner: bool = False
    partner_call_freq: str = ''
    # 学习
    study_location: str = ''
    quiet_study: bool = False
    exam_behavior: str = ''
    remote_work: bool = False
    room_time: str = ''
    # 共享
    item_sharing: str = ''
    borrow_tolerance: str = ''
    eat_near_desk: str = ''
    public_space: str = ''
    # 沟通
    conflict_resolution: str = ''
    covenant_willingness: bool = False
    duty_system: str = ''
    # 特殊
    special_schedule: str = ''


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
    evidence_images: list[str] = []  # 证据图片URL列表


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


# ==================== 投票模块 ====================

class CreateVoteRequest(BaseModel):
    """创建投票 - 请求"""
    room_id: str
    title: str
    description: Optional[str] = None
    options: List[str]  # 投票选项列表
    vote_type: str = "PLAN"  # PLAN, REVISION, GENERAL
    related_plan_id: Optional[str] = None
    expires_in_hours: int = 48


class CastVoteRequest(BaseModel):
    """投票 - 请求"""
    vote_id: str
    option_index: int  # 选项索引
    voter_id: Optional[str] = None  # 可从token获取


class VoteOption(BaseModel):
    """投票选项"""
    index: int
    text: str
    vote_count: int
    voter_ids: List[str]


class VoteDetail(BaseModel):
    """投票详情"""
    vote_id: str
    room_id: str
    title: str
    description: Optional[str]
    vote_type: str
    status: str  # ACTIVE, PASSED, REJECTED, EXPIRED
    options: List[VoteOption]
    total_voters: int
    total_voted: int
    related_plan_id: Optional[str]
    created_at: str
    expires_at: str
    result: Optional[str] = None


class VoteListResponse(BaseModel):
    """投票列表 - 响应"""
    votes: List[VoteDetail]
    total: int


# ==================== 通用响应类型 ====================

class StandardResponse(BaseModel):
    """标准响应包装"""
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None


# ==================== 寝室模块 ====================

class RoomMember(BaseModel):
    """寝室成员"""
    user_id: str
    username: str
    credit_score: int
    is_email_verified: bool
    created_at: str


class RoomMembersResponse(BaseModel):
    """寝室成员列表 - 响应"""
    room_id: str
    members: List[RoomMember]
    total: int


class Activity(BaseModel):
    """活动记录"""
    type: str
    title: str
    description: str
    time: str
    icon: str


class ActivityResponse(BaseModel):
    """活动记录列表 - 响应"""
    activities: List[Activity]
    total: int


class RankingItem(BaseModel):
    """排行榜项目"""
    rank: int
    user_id: str
    username: str
    credit_score: int
    is_self: bool


class RankingResponse(BaseModel):
    """排行榜 - 响应"""
    ranking: List[RankingItem]
    total: int


# ==================== 管理员模块 ====================

class AppealRequest(BaseModel):
    """申诉请求"""
    violation_id: int
    reason: str


class ReviewRequest(BaseModel):
    """管理员审核请求"""
    violation_id: int
    action: str  # uphold (维持原判) / overturn (撤销) / request_evidence (要求补证)
    note: Optional[str] = None
    deducted_points: Optional[int] = None  # overturn时可指定恢复分数


class AddAdminRequest(BaseModel):
    """添加管理员"""
    user_id: str
    target_role: str = Field(default="school_admin", pattern=r'^(school_admin|super_admin)$')


class BanUserRequest(BaseModel):
    """封禁用户"""
    user_id: str
    ban: bool = True


class ForceModifyCovenantRequest(BaseModel):
    """强制修改公约"""
    room_id: str
    plan_details: Dict[str, Any]


class AdminViolationItem(BaseModel):
    """管理员审核队列项"""
    id: int
    room_id: str
    reporter_id: str
    reporter_name: str
    violator_id: str
    violator_name: str
    rule_type: str
    evidence_log: str
    evidence_images: List[str]
    status: str
    ai_score: Optional[float]
    ai_decision: Optional[str]
    ai_analysis: Optional[str]
    appeal_reason: Optional[str]
    appeal_status: Optional[str]
    deducted_points: int
    created_at: str


class AdminViolationListResponse(BaseModel):
    """管理员审核队列"""
    items: List[AdminViolationItem]
    total: int
