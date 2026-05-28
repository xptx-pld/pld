"""
行为洞察接口 API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.deps import get_current_user
from app.models.shared import User, IoTData, Violation, Preference
from app.utils.response_wrapper import ResponseWrapper
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


@router.get("/contrast-report")
async def get_contrast_report(
    user_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    获取"自报 vs 真实"偏好校准报告
    """
    try:
        # TODO: 实现对比分析报告生成逻辑
        report = {
            "userId": user_id,
            "explicitProfile": {
                "sleepTime": "23:30",
                "acTemp": 26
            },
            "implicitProfile": {
                "actualAverageSleepTime": "01:15",
                "actualAcTemp": 24
            },
            "conflictTags": ["习惯性晚睡", "强嗜冷体质"],
            "conclusion": "数据眼中的你比自报的睡得更晚（平均延迟1.5小时），且在半夜倾向于调低空调温度。存在认知与实际行为的偏差。"
        }
        return ResponseWrapper.success(data=report)

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/conflict-prediction")
async def get_conflict_prediction(
    room_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    获取寝室时序冲突预警
    """
    try:
        # TODO: 实现冲突预测算法
        prediction = {
            "roomId": room_id,
            "warningLevel": "HIGH",
            "probability": 0.78,
            "triggerFactors": [
                "本周五气温骤降5度",
                "全员周五均有早八必修课",
                "室友B近期高频熬夜，历史数据显示其在降温天气更容易因关灯时间产生寝室摩擦"
            ],
            "predictionMessage": "预测：本周五降温 + 你们有早八，因空调温度与作息冲突的概率高达78%，建议提前制定折中预案。"
        }
        return ResponseWrapper.success(data=prediction)

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/trends")
async def get_behavior_trends(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    获取行为趋势数据
    """
    try:
        if not user.room_id:
            return ResponseWrapper.success(data={
                "labels": [],
                "datasets": [],
            })

        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        iot_data = db.query(
            func.date(IoTData.event_timestamp).label('date'),
            func.count(IoTData.id).label('count')
        ).filter(
            IoTData.room_id == user.room_id,
            IoTData.event_timestamp >= seven_days_ago,
        ).group_by(
            func.date(IoTData.event_timestamp)
        ).all()

        violations = db.query(
            func.date(Violation.created_at).label('date'),
            func.count(Violation.id).label('count')
        ).filter(
            Violation.room_id == user.room_id,
            Violation.created_at >= seven_days_ago,
        ).group_by(
            func.date(Violation.created_at)
        ).all()

        labels = []
        iot_values = []
        violation_values = []

        for i in range(6, -1, -1):
            date = datetime.utcnow() - timedelta(days=i)
            date_str = date.strftime('%m-%d')
            labels.append(date_str)

            iot_count = next((r.count for r in iot_data if str(r.date) == date.strftime('%Y-%m-%d')), 0)
            violation_count = next((r.count for r in violations if str(r.date) == date.strftime('%Y-%m-%d')), 0)

            iot_values.append(iot_count)
            violation_values.append(violation_count)

        return ResponseWrapper.success(data={
            "labels": labels,
            "datasets": [
                {
                    "label": "IoT 操作",
                    "data": iot_values,
                    "color": "#3b82f6",
                },
                {
                    "label": "违约事件",
                    "data": violation_values,
                    "color": "#ef4444",
                },
            ],
        })

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/room-comparison")
async def get_room_comparison(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    获取室友行为对比数据
    """
    try:
        if not user.room_id:
            return ResponseWrapper.success(data={
                "members": [],
                "metrics": [],
            })

        members = db.query(User).filter(User.room_id == user.room_id).all()

        member_data = []
        for m in members:
            pref = db.query(Preference).filter(
                Preference.user_id == m.user_id,
                Preference.room_id == user.room_id,
            ).first()

            violation_count = db.query(func.count(Violation.id)).filter(
                Violation.violator_id == m.user_id,
                Violation.room_id == user.room_id,
            ).scalar()

            member_data.append({
                "user_id": m.user_id,
                "username": m.username,
                "credit_score": m.credit_score,
                "violation_count": violation_count,
                "sleep_time": pref.sleep_time if pref else None,
                "noise_tolerance": pref.noise_tolerance_level if pref else None,
            })

        return ResponseWrapper.success(data={
            "members": member_data,
            "metrics": [
                {"key": "credit_score", "label": "信用积分", "max": 100},
                {"key": "violation_count", "label": "违约次数", "max": 10},
                {"key": "noise_tolerance", "label": "噪音容忍度", "max": 5},
            ],
        })

    except Exception as e:
        return ResponseWrapper.server_error(str(e))
