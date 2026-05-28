"""
认证模块路由 - 注册、登录、OTP验证等
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.schemas.request import (
    RegisterEmailRequest,
    RegisterPhoneRequest,
    SendEmailOTPRequest,
    SendPhoneOTPRequest,
    VerifyEmailOTPRequest,
    VerifyPhoneOTPRequest,
    LoginEmailRequest,
    LoginPhoneRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserProfileResponse,
    OTPResponse,
    SchoolListResponse,
    SchoolResponse,
)
from app.services.user_service import UserService
from app.services.auth_service import PasswordService, JWTService
from app.services.school_service import SchoolService
from app.services.email_service import send_otp_email, send_welcome_email
from app.services.otp_service import get_otp_service
from app.models.shared import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ===================== 学校列表 =====================

@router.get("/schools", response_model=SchoolListResponse, summary="获取学校列表")
async def get_schools(db: Session = Depends(get_db)):
    """获取所有激活的学校（无需认证）"""
    schools = SchoolService.get_all_active_schools(db)
    return SchoolListResponse(
        schools=[
            SchoolResponse(
                school_id=s.school_id,
                school_name=s.school_name,
                is_active=s.is_active,
            )
            for s in schools
        ],
        total=len(schools),
    )


# ===================== 邮箱注册流程 =====================

@router.post("/email/send-otp", response_model=OTPResponse, summary="发送邮箱验证码")
async def send_email_otp(
    request: SendEmailOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """发送邮箱OTP验证码"""
    if UserService.email_exists(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已注册"
        )

    try:
        svc = await get_otp_service()
        otp = await svc.generate_and_store_otp(request.email, "email")
        background_tasks.add_task(send_otp_email, request.email, otp)

        return OTPResponse(
            message="验证码已发送，请查收邮件",
            target=request.email,
            resend_in=600
        )

    except RuntimeError as e:
        logger.error(f"Redis错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="系统错误，请稍后重试"
        )


@router.post("/email/register", response_model=TokenResponse, summary="邮箱注册")
async def register_email(
    request: VerifyEmailOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """使用邮箱和OTP完成注册"""
    # 验证学校
    school = SchoolService.get_school_by_id(db, request.school_id)
    if not school or not school.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请选择有效的学校"
        )

    # 验证OTP
    svc = await get_otp_service()
    is_valid = await svc.verify_otp(request.email, request.otp, "email")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期"
        )

    if UserService.email_exists(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已注册"
        )

    try:
        user = UserService.create_user(
            db=db,
            school_id=request.school_id,
            email=request.email,
            username=request.email.split('@')[0],
            password=request.password,
        )

        UserService.verify_email(db, request.email)

        tokens = JWTService.generate_tokens(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            school_id=user.school_id,
            role=user.role,
        )

        background_tasks.add_task(send_welcome_email, user.username, user.email)

        logger.info(f"用户通过邮箱注册成功: {user.user_id}")
        return tokens

    except Exception as e:
        logger.error(f"邮箱注册失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册失败，请稍后重试"
        )


@router.post("/email/login", response_model=TokenResponse, summary="邮箱登录")
async def login_email(
    request: LoginEmailRequest,
    db: Session = Depends(get_db),
):
    """使用邮箱和密码登录"""
    user = UserService.get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )

    if not PasswordService.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被封禁"
        )

    tokens = JWTService.generate_tokens(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        school_id=user.school_id,
        role=user.role,
    )

    logger.info(f"用户邮箱登录成功: {user.user_id}")
    return tokens


# ===================== 电话号码注册流程 =====================

@router.post("/phone/send-otp", response_model=OTPResponse, summary="发送电话验证码")
async def send_phone_otp(
    request: SendPhoneOTPRequest,
    db: Session = Depends(get_db),
):
    """发送电话OTP验证码"""
    if UserService.phone_exists(db, request.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该电话号码已注册"
        )

    try:
        svc = await get_otp_service()
        otp = await svc.generate_and_store_otp(request.phone, "phone")

        logger.info(f"为电话 {request.phone} 生成OTP: {otp} (虚拟模式)")

        return OTPResponse(
            message=f"验证码（虚拟模式）: {otp}",
            target=request.phone,
            resend_in=600
        )

    except RuntimeError as e:
        logger.error(f"Redis错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="系统错误，请稍后重试"
        )


@router.post("/phone/register", response_model=TokenResponse, summary="电话注册")
async def register_phone(
    request: VerifyPhoneOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """使用电话号码和OTP完成注册"""
    # 验证学校
    school = SchoolService.get_school_by_id(db, request.school_id)
    if not school or not school.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请选择有效的学校"
        )

    # 验证OTP
    svc = await get_otp_service()
    is_valid = await svc.verify_otp(request.phone, request.otp, "phone")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期"
        )

    if UserService.phone_exists(db, request.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该电话号码已注册"
        )

    try:
        user = UserService.create_user(
            db=db,
            school_id=request.school_id,
            phone=request.phone,
            username=f"user_{request.phone[-8:]}",
            password=request.password,
        )

        UserService.verify_phone(db, request.phone)

        tokens = JWTService.generate_tokens(
            user_id=user.user_id,
            username=user.username,
            phone=user.phone,
            school_id=user.school_id,
            role=user.role,
        )

        logger.info(f"用户通过电话注册成功: {user.user_id}")
        return tokens

    except Exception as e:
        logger.error(f"电话注册失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册失败，请稍后重试"
        )


@router.post("/phone/login", response_model=TokenResponse, summary="电话登录")
async def login_phone(
    request: LoginPhoneRequest,
    db: Session = Depends(get_db),
):
    """使用电话号码和密码登录"""
    user = UserService.get_user_by_phone(db, request.phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="电话或密码错误"
        )

    if not PasswordService.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="电话或密码错误"
        )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被封禁"
        )

    tokens = JWTService.generate_tokens(
        user_id=user.user_id,
        username=user.username,
        phone=user.phone,
        school_id=user.school_id,
        role=user.role,
    )

    logger.info(f"用户电话登录成功: {user.user_id}")
    return tokens


# ===================== Token管理 =====================

@router.post("/refresh", response_model=TokenResponse, summary="刷新Access Token")
async def refresh_token(request: RefreshTokenRequest):
    """使用Refresh Token获取新的Access Token"""
    tokens = JWTService.refresh_access_token(request.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token无效或已过期"
        )

    return tokens


# ===================== 用户信息 =====================

@router.get("/profile", response_model=UserProfileResponse, summary="获取用户资料")
async def get_profile(
    user: User = Depends(get_current_user),
):
    """获取当前用户的资料"""
    return UserProfileResponse(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        phone=user.phone,
        school_id=user.school_id,
        credit_score=user.credit_score,
        is_email_verified=user.is_email_verified,
        is_phone_verified=user.is_phone_verified,
        role=user.role or "user",
        room_id=user.room_id,
        created_at=user.created_at,
    )
