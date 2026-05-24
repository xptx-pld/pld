"""
管理员模块 API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.shared import User, Violation, Room
from app.schemas.request import (
    AppealRequest,
    ReviewRequest,
    AddAdminRequest,
    BanUserRequest,
    ForceModifyCovenantRequest,
    AdminViolationListResponse,
    AdminViolationItem,
)
from app.services.auth_service import JWTService
from app.utils.response_wrapper import ResponseWrapper
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


def get_current_admin(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """获取当前管理员用户"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少认证信息")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except (ValueError, AttributeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的认证信息")

    user_id = JWTService.extract_user_id(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token无效或已过期")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足，需要管理员权限")

    return user


# ==================== 违约审核 ====================

@router.get("/violations", response_model=AdminViolationListResponse, summary="获取待审核违约列表")
async def get_violations(
    status_filter: str = "all",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """获取待审核的违约记录（AI失败 + 被申诉）"""
    query = db.query(Violation)

    if status_filter == "pending":
        query = query.filter(Violation.status == "pending_analysis")
    elif status_filter == "appealed":
        query = query.filter(Violation.appeal_status == "pending")
    elif status_filter == "ai_failed":
        query = query.filter(Violation.status == "ai_failed")
    else:
        # 所有需要关注的记录
        query = query.filter(
            (Violation.status.in_(["pending_analysis", "ai_failed", "analyzed"]))
            | (Violation.appeal_status == "pending")
        )

    violations = query.order_by(desc(Violation.created_at)).all()

    items = []
    for v in violations:
        reporter = db.query(User).filter(User.user_id == v.reporter_id).first()
        violator = db.query(User).filter(User.user_id == v.violator_id).first()
        items.append(AdminViolationItem(
            id=v.id,
            room_id=v.room_id,
            reporter_id=v.reporter_id,
            reporter_name=reporter.username if reporter else "未知",
            violator_id=v.violator_id,
            violator_name=violator.username if violator else "未知",
            rule_type=v.rule_type,
            evidence_log=v.evidence_log,
            evidence_images=json.loads(v.evidence_images) if v.evidence_images else [],
            status=v.status,
            ai_score=v.ai_score,
            ai_decision=v.ai_decision,
            ai_analysis=v.ai_analysis,
            appeal_reason=v.appeal_reason,
            appeal_status=v.appeal_status,
            deducted_points=v.deducted_points,
            created_at=v.created_at.isoformat() if v.created_at else "",
        ))

    return AdminViolationListResponse(items=items, total=len(items))


@router.post("/violations/review", summary="管理员审核违约")
async def review_violation(
    request: ReviewRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """管理员审核违约记录"""
    violation = db.query(Violation).filter(Violation.id == request.violation_id).first()
    if not violation:
        return ResponseWrapper.not_found("违约记录不存在")

    if request.action == "uphold":
        # 维持原判：执行扣分
        violation.status = "reviewed"
        violation.appeal_status = "upheld"
        violation.deducted_points = request.deducted_points or violation.deducted_points or 5

        # 扣分
        violator = db.query(User).filter(User.user_id == violation.violator_id).first()
        if violator:
            violator.credit_score = max(0, violator.credit_score - violation.deducted_points)

    elif request.action == "overturn":
        # 撤销：恢复分数
        violation.status = "reviewed"
        violation.appeal_status = "overturned"
        violation.deducted_points = 0

        # 恢复分数（如果之前扣过）
        violator = db.query(User).filter(User.user_id == violation.violator_id).first()
        if violator and request.deducted_points:
            violator.credit_score = min(100, violator.credit_score + request.deducted_points)

    elif request.action == "request_evidence":
        # 要求补充证据
        violation.status = "evidence_required"

    else:
        return ResponseWrapper.client_error("无效的操作")

    violation.reviewer_id = admin.user_id
    violation.review_note = request.note
    violation.reviewed_at = datetime.utcnow()
    db.commit()

    return ResponseWrapper.success(message=f"审核完成：{request.action}")


# ==================== 申诉 ====================

@router.post("/appeal", summary="用户申诉")
async def submit_appeal(
    request: AppealRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """被扣分者提交申诉"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少认证信息")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except (ValueError, AttributeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的认证信息")

    user_id = JWTService.extract_user_id(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token无效")

    violation = db.query(Violation).filter(Violation.id == request.violation_id).first()
    if not violation:
        return ResponseWrapper.not_found("违约记录不存在")

    if violation.violator_id != user_id:
        return ResponseWrapper.client_error("只能对自己的违约记录提出申诉")

    if violation.status not in ["analyzed", "deducted"]:
        return ResponseWrapper.client_error("当前状态不允许申诉")

    violation.appeal_reason = request.reason
    violation.appeal_status = "pending"
    violation.status = "appealed"
    db.commit()

    return ResponseWrapper.success(message="申诉已提交，等待管理员审核")


# ==================== 确认扣分 ====================

@router.post("/confirm-deduct", summary="确认扣分")
async def confirm_deduct(
    violation_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """举报者确认对违约者执行扣分（AI通过后）"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少认证信息")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except (ValueError, AttributeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的认证信息")

    user_id = JWTService.extract_user_id(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token无效")

    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        return ResponseWrapper.not_found("违约记录不存在")

    if violation.reporter_id != user_id:
        return ResponseWrapper.client_error("只有举报者可以确认扣分")

    if violation.status != "analyzed" or violation.ai_decision != "pass":
        return ResponseWrapper.client_error("当前状态不允许扣分")

    # 执行扣分
    violation.status = "deducted"
    violation.deducted_points = 5  # 默认扣5分

    violator = db.query(User).filter(User.user_id == violation.violator_id).first()
    if violator:
        violator.credit_score = max(0, violator.credit_score - violation.deducted_points)

    db.commit()

    return ResponseWrapper.success(message="扣分已执行")


# ==================== 用户管理 ====================

@router.get("/users", summary="获取用户列表")
async def get_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """获取所有用户"""
    users = db.query(User).order_by(User.created_at.desc()).all()
    user_list = [
        {
            "user_id": u.user_id,
            "username": u.username,
            "email": u.email,
            "phone": u.phone,
            "room_id": u.room_id,
            "credit_score": u.credit_score,
            "role": u.role,
            "is_banned": u.is_banned,
            "created_at": u.created_at.isoformat() if u.created_at else "",
        }
        for u in users
    ]
    return ResponseWrapper.success(data={"users": user_list, "total": len(user_list)})


@router.post("/add-admin", summary="添加管理员")
async def add_admin(
    request: AddAdminRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """添加新管理员"""
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        return ResponseWrapper.not_found("用户不存在")

    if user.role == "admin":
        return ResponseWrapper.client_error("该用户已是管理员")

    user.role = "admin"
    db.commit()

    return ResponseWrapper.success(message=f"已将 {user.username} 设为管理员")


@router.post("/ban-user", summary="封禁/解封用户")
async def ban_user(
    request: BanUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """封禁或解封用户"""
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        return ResponseWrapper.not_found("用户不存在")

    if user.role == "admin":
        return ResponseWrapper.client_error("不能封禁管理员")

    user.is_banned = request.ban
    db.commit()

    action = "封禁" if request.ban else "解封"
    return ResponseWrapper.success(message=f"已{action}用户 {user.username}")


# ==================== 寝室管理 ====================

@router.get("/rooms", summary="获取寝室列表")
async def get_rooms(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """获取所有寝室"""
    rooms = db.query(Room).all()
    room_list = []
    for r in rooms:
        member_count = db.query(User).filter(User.room_id == r.room_id).count()
        room_list.append({
            "room_id": r.room_id,
            "room_name": r.room_name,
            "capacity": r.capacity,
            "current_cycle": r.current_cycle,
            "member_count": member_count,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        })
    return ResponseWrapper.success(data={"rooms": room_list, "total": len(room_list)})


@router.post("/rooms/{room_id}/dissolve", summary="解散寝室")
async def dissolve_room(
    room_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """解散寝室，将成员的room_id清空"""
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        return ResponseWrapper.not_found("寝室不存在")

    # 清空成员的room_id
    members = db.query(User).filter(User.room_id == room_id).all()
    for m in members:
        m.room_id = None

    db.delete(room)
    db.commit()

    return ResponseWrapper.success(message=f"寝室 {room_id} 已解散，{len(members)} 名成员已移出")
