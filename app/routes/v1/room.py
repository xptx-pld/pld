"""
寝室相关路由 - 成员管理、活动记录、排行榜
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.shared import User, Violation, GovernanceRevision, IoTData
from app.schemas.request import (
    RoomMembersResponse,
    ActivityResponse,
    RankingResponse,
)
from app.services.auth_service import JWTService
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/room", tags=["Room"])


def get_current_user(authorization: str, db: Session) -> User:
    """从 token 获取当前用户"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证信息"
        )

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证信息"
        )

    user_id = JWTService.extract_user_id(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token无效或已过期"
        )

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    return user


@router.get("/members", response_model=RoomMembersResponse, summary="获取寝室成员")
async def get_room_members(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """
    获取当前寝室的所有成员
    """
    user = get_current_user(authorization, db)

    if not user.room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户未加入任何寝室"
        )

    members = db.query(User).filter(User.room_id == user.room_id).all()

    return RoomMembersResponse(
        room_id=user.room_id,
        members=[
            {
                "user_id": m.user_id,
                "username": m.username,
                "credit_score": m.credit_score,
                "is_email_verified": m.is_email_verified,
                "created_at": m.created_at.isoformat(),
            }
            for m in members
        ],
        total=len(members),
    )


@router.get("/activities", response_model=ActivityResponse, summary="获取最近活动")
async def get_recent_activities(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """
    获取寝室最近活动记录
    """
    user = get_current_user(authorization, db)

    if not user.room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户未加入任何寝室"
        )

    # 获取最近7天的活动
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # 违约记录
    violations = db.query(Violation).filter(
        Violation.room_id == user.room_id,
        Violation.created_at >= seven_days_ago,
    ).order_by(desc(Violation.created_at)).limit(10).all()

    # 治理修订
    revisions = db.query(GovernanceRevision).filter(
        GovernanceRevision.room_id == user.room_id,
        GovernanceRevision.created_at >= seven_days_ago,
    ).order_by(desc(GovernanceRevision.created_at)).limit(10).all()

    # IoT 数据
    iot_data = db.query(IoTData).filter(
        IoTData.room_id == user.room_id,
        IoTData.event_timestamp >= seven_days_ago,
    ).order_by(desc(IoTData.event_timestamp)).limit(10).all()

    activities = []

    for v in violations:
        violator = db.query(User).filter(User.user_id == v.violator_id).first()
        activities.append({
            "type": "violation",
            "title": f"{violator.username if violator else '未知'} 违约",
            "description": f"规则: {v.rule_type}, 扣除 {v.deducted_points} 分",
            "time": v.created_at.isoformat(),
            "icon": "🚨",
        })

    for r in revisions:
        activities.append({
            "type": "revision",
            "title": "公约修订",
            "description": f"周期 {r.cycle_number} - {r.status}",
            "time": r.created_at.isoformat(),
            "icon": "🔄",
        })

    for i in iot_data:
        operator = db.query(User).filter(User.user_id == i.operator_id).first()
        activities.append({
            "type": "iot",
            "title": f"{i.device_type} 操作",
            "description": f"{operator.username if operator else '未知'} {i.action}: {i.value}",
            "time": i.event_timestamp.isoformat(),
            "icon": "📱",
        })

    # 按时间排序
    activities.sort(key=lambda x: x["time"], reverse=True)

    return ActivityResponse(
        activities=activities[:20],
        total=len(activities),
    )


@router.get("/ranking", response_model=RankingResponse, summary="获取信用积分排行榜")
async def get_credit_ranking(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """
    获取寝室成员信用积分排行榜
    """
    user = get_current_user(authorization, db)

    if not user.room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户未加入任何寝室"
        )

    members = db.query(User).filter(
        User.room_id == user.room_id
    ).order_by(desc(User.credit_score)).all()

    ranking = [
        {
            "rank": idx + 1,
            "user_id": m.user_id,
            "username": m.username,
            "credit_score": m.credit_score,
            "is_self": m.user_id == user.user_id,
        }
        for idx, m in enumerate(members)
    ]

    return RankingResponse(
        ranking=ranking,
        total=len(ranking),
    )
