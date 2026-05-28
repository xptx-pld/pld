"""
寝室相关路由 - 成员管理、活动记录、排行榜、创建/加入
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.deps import get_current_user
from app.models.shared import User, Room, Violation, GovernanceRevision, IoTData
from app.schemas.request import (
    RoomMembersResponse,
    ActivityResponse,
    RankingResponse,
    CreateRoomRequest,
    JoinRoomRequest,
)
from app.utils.response_wrapper import ResponseWrapper
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/room", tags=["Room"])


@router.post("/create", summary="创建寝室")
async def create_room(
    request: CreateRoomRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """创建新寝室，创建者自动加入"""
    if user.room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="你已加入寝室，请先退出当前寝室"
        )

    room_id = f"R_{uuid.uuid4().hex[:8].upper()}"
    new_room = Room(
        room_id=room_id,
        school_id=user.school_id,
        room_name=request.room_name,
        capacity=request.capacity,
    )
    db.add(new_room)

    user.room_id = room_id
    db.commit()
    db.refresh(new_room)

    logger.info(f"寝室已创建: {room_id} by {user.user_id}")
    return ResponseWrapper.success(
        data={
            "room_id": new_room.room_id,
            "room_name": new_room.room_name,
            "capacity": new_room.capacity,
            "school_id": new_room.school_id,
        },
        message="寝室创建成功",
    )


@router.post("/join", summary="加入寝室")
async def join_room(
    request: JoinRoomRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """通过寝室ID加入寝室"""
    if user.room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="你已加入寝室，请先退出当前寝室"
        )

    room = db.query(Room).filter(Room.room_id == request.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="寝室不存在"
        )

    if room.school_id != user.school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="不能加入其他学校的寝室"
        )

    # 检查容量
    member_count = db.query(User).filter(User.room_id == room.room_id).count()
    if member_count >= room.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"寝室已满（{room.capacity}人）"
        )

    user.room_id = room.room_id
    db.commit()

    logger.info(f"用户 {user.user_id} 加入寝室 {room.room_id}")
    return ResponseWrapper.success(
        data={
            "room_id": room.room_id,
            "room_name": room.room_name,
        },
        message="成功加入寝室",
    )


@router.get("/members", response_model=RoomMembersResponse, summary="获取寝室成员")
async def get_room_members(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取当前寝室的所有成员"""
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
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取寝室最近活动记录"""
    if not user.room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户未加入任何寝室"
        )

    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    violations = db.query(Violation).filter(
        Violation.room_id == user.room_id,
        Violation.created_at >= seven_days_ago,
    ).order_by(desc(Violation.created_at)).limit(10).all()

    revisions = db.query(GovernanceRevision).filter(
        GovernanceRevision.room_id == user.room_id,
        GovernanceRevision.created_at >= seven_days_ago,
    ).order_by(desc(GovernanceRevision.created_at)).limit(10).all()

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

    activities.sort(key=lambda x: x["time"], reverse=True)

    return ActivityResponse(
        activities=activities[:20],
        total=len(activities),
    )


@router.get("/ranking", response_model=RankingResponse, summary="获取信用积分排行榜")
async def get_credit_ranking(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取寝室成员信用积分排行榜"""
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
