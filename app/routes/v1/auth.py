"""
认证模块路由 - 注册、登录、OTP验证等
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
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
)
from app.services.user_service import UserService
from app.services.auth_service import PasswordService, JWTService
from app.services.email_service import send_otp_email, send_welcome_email
from app.services.otp_service import otp_service
from app.models.shared import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ===================== 邮箱注册流程 =====================

@router.post("/email/send-otp", response_model=OTPResponse, summary="发送邮箱验证码")
async def send_email_otp(
    request: SendEmailOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    发送邮箱OTP验证码
    
    - 检查邮箱是否已注册
    - 生成OTP并存储到Redis
    - 发送OTP邮件
    """
    # 检查邮箱是否已注册
    if UserService.email_exists(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已注册"
        )

    try:
        # 生成OTP
        otp = await otp_service.generate_and_store_otp(request.email, "email")

        # 异步发送邮件
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
    """
    使用邮箱和OTP完成注册
    
    - 验证OTP
    - 创建用户
    - 生成JWT token
    - 发送欢迎邮件
    """
    # 验证OTP
    is_valid = await otp_service.verify_otp(request.email, request.otp, "email")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期"
        )

    # 检查邮箱是否已注册
    if UserService.email_exists(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已注册"
        )

    try:
        # 创建用户
        user = UserService.create_user(
            db=db,
            email=request.email,
            username=request.email.split('@')[0],  # 使用邮箱前缀作为用户名
            password=request.password,
        )

        # 标记邮箱为已验证
        UserService.verify_email(db, request.email)

        # 生成tokens
        tokens = JWTService.generate_tokens(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
        )

        # 异步发送欢迎邮件
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
    """
    使用邮箱和密码登录
    
    - 查找用户
    - 验证密码
    - 生成JWT token
    """
    # 查找用户
    user = UserService.get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )

    # 验证密码
    if not PasswordService.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )

    # 生成tokens
    tokens = JWTService.generate_tokens(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
    )

    logger.info(f"用户邮箱登录成功: {user.user_id}")
    return tokens


# ===================== 电话号码注册流程 =====================

@router.post("/phone/send-otp", response_model=OTPResponse, summary="发送电话验证码")
async def send_phone_otp(
    request: SendPhoneOTPRequest,
    db: Session = Depends(get_db),
):
    """
    发送电话OTP验证码
    
    - 检查电话是否已注册
    - 生成OTP并存储到Redis
    - 返回OTP给前端（虚拟模式）
    """
    # 检查电话是否已注册
    if UserService.phone_exists(db, request.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该电话号码已注册"
        )

    try:
        # 生成OTP
        otp = await otp_service.generate_and_store_otp(request.phone, "phone")

        # 注意：在真实场景中，这里应该发送短信
        # 在虚拟模式下，我们直接返回OTP用于测试
        logger.info(f"为电话 {request.phone} 生成OTP: {otp} (虚拟模式)")

        return OTPResponse(
            message=f"验证码（虚拟模式）: {otp}",  # 仅用于开发/测试
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
    """
    使用电话号码和OTP完成注册
    
    - 验证OTP
    - 创建用户
    - 生成JWT token
    """
    # 验证OTP
    is_valid = await otp_service.verify_otp(request.phone, request.otp, "phone")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期"
        )

    # 检查电话是否已注册
    if UserService.phone_exists(db, request.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该电话号码已注册"
        )

    try:
        # 创建用户
        user = UserService.create_user(
            db=db,
            phone=request.phone,
            username=f"user_{request.phone[-8:]}",  # 使用电话号码后8位作为用户名
            password=request.password,
        )

        # 标记电话为已验证
        UserService.verify_phone(db, request.phone)

        # 生成tokens
        tokens = JWTService.generate_tokens(
            user_id=user.user_id,
            username=user.username,
            phone=user.phone,
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
    """
    使用电话号码和密码登录
    
    - 查找用户
    - 验证密码
    - 生成JWT token
    """
    # 查找用户
    user = UserService.get_user_by_phone(db, request.phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="电话或密码错误"
        )

    # 验证密码
    if not PasswordService.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="电话或密码错误"
        )

    # 生成tokens
    tokens = JWTService.generate_tokens(
        user_id=user.user_id,
        username=user.username,
        phone=user.phone,
    )

    logger.info(f"用户电话登录成功: {user.user_id}")
    return tokens


# ===================== Token管理 =====================

@router.post("/refresh", response_model=TokenResponse, summary="刷新Access Token")
async def refresh_token(request: RefreshTokenRequest):
    """
    使用Refresh Token获取新的Access Token
    
    - 验证refresh token
    - 生成新的access token
    """
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
    authorization: str = None,
    db: Session = Depends(get_db),
):
    """
    获取当前用户的资料
    
    - 从token中提取user_id
    - 返回用户信息
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证信息"
        )

    # 提取token
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证信息"
        )

    # 验证token并获取user_id
    user_id = JWTService.extract_user_id(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token无效或已过期"
        )

    # 获取用户
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    return UserProfileResponse(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        phone=user.phone,
        credit_score=user.credit_score,
        is_email_verified=user.is_email_verified,
        is_phone_verified=user.is_phone_verified,
        created_at=user.created_at,
    )
