"""
模块一：行为洞察与数据深度模块 API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.shared import User
from app.schemas.request import (
    ExplicitPreferenceRequest,
    FullPreferenceRequest,
    ContrastReportResponse,
    ConflictPredictionResponse
)
from app.utils.response_wrapper import ResponseWrapper

router = APIRouter(prefix="/api/v1/preferences", tags=["Preferences"])


@router.post("/explicit")
async def submit_explicit_preference(
    request: ExplicitPreferenceRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """提交/更新个人显式偏好"""
    try:
        # TODO: 实现保存用户偏好到数据库的逻辑
        data = {
            "userId": request.user_id,
            "roomId": request.room_id,
            "sleepTime": request.sleep_time,
            "acTempPreference": request.ac_temp_preference,
            "noiseToleranceLevel": request.noise_tolerance_level,
            "saved": True
        }
        return ResponseWrapper.success(data=data, message="偏好已保存")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/full")
async def submit_full_preference(
    request: FullPreferenceRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """提交/更新完整生活偏好"""
    try:
        from app.models.shared import UserHabit
        from datetime import datetime

        # 查找现有记录
        habit = db.query(UserHabit).filter(UserHabit.user_id == user.user_id).first()

        data = request.model_dump()

        if habit:
            # 更新现有记录
            for key, value in data.items():
                if hasattr(habit, key) and key != 'user_id':
                    setattr(habit, key, value)
            habit.updated_at = datetime.utcnow()
        else:
            # 创建新记录
            habit = UserHabit(user_id=user.user_id, **data)
            db.add(habit)

        db.commit()
        db.refresh(habit)

        return ResponseWrapper.success(data={"saved": True}, message="完整偏好已保存")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/my")
async def get_my_preference(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取当前用户的偏好设置"""
    try:
        from app.models.shared import UserHabit

        habit = db.query(UserHabit).filter(UserHabit.user_id == user.user_id).first()

        if not habit:
            return ResponseWrapper.success(data=None, message="暂无偏好数据")

        # 转换为前端需要的格式
        data = {
            "sleepTime": habit.sleep_time or "",
            "wakeTime": habit.wake_time or "",
            "expectedSleepTime": "",
            "expectedWakeTime": "",
            "weekendDiff": "",
            "alarmHabit": "",
            "napHabit": habit.nap_habit or False,
            "stayUpLate": habit.stay_up_late or False,
            "cleanliness": habit.cleanliness or "",
            "cleanLevel": habit.clean_level or 3,
            "showerFreq": "",
            "clothesWash": "",
            "trashDuty": "",
            "mealRegularity": "",
            "strongFood": "",
            "deliveryFreq": "",
            "tempPreference": habit.temp_preference or "",
            "windowVentilation": habit.window_ventilation or False,
            "lightPreference": habit.light_preference or "",
            "acHabit": "",
            "nightLight": "",
            "noiseSensitivity": habit.noise_sensitivity or "",
            "useHeadphones": habit.use_headphones or False,
            "gameVideoSound": habit.game_video_sound or False,
            "videoCallTolerance": "",
            "videoCallFreq": "",
            "personality": habit.personality or "",
            "bringFriends": habit.bring_friends or "",
            "smoking": habit.smoking or False,
            "snoring": habit.snoring or False,
            "hasPartner": False,
            "partnerCallFreq": "",
            "studyLocation": habit.study_location or "",
            "quietStudy": habit.quiet_study or False,
            "examBehavior": "",
            "remoteWork": False,
            "roomTime": "",
            "itemSharing": "",
            "borrowTolerance": "",
            "eatNearDesk": "",
            "publicSpace": "",
            "conflictResolution": "",
            "covenantWillingness": False,
            "dutySystem": "",
            "specialSchedule": habit.special_schedule or "",
        }

        return ResponseWrapper.success(data=data)

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/contrast-report")
async def get_contrast_report(
    user_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取"自报 vs 真实"偏好校准报告"""
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
    """获取寝室时序冲突预警"""
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
