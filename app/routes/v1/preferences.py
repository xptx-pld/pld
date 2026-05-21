"""
模块一：行为洞察与数据深度模块 API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.request import (
    ExplicitPreferenceRequest,
    ContrastReportResponse,
    ConflictPredictionResponse
)
from app.utils.response_wrapper import ResponseWrapper

router = APIRouter(prefix="/api/v1/preferences", tags=["Preferences"])


@router.post("/explicit")
async def submit_explicit_preference(
    request: ExplicitPreferenceRequest,
    db: Session = Depends(get_db)
):
    """
    提交/更新个人显式偏好

    - **userId**: 用户唯一标识
    - **roomId**: 所属房间
    - **sleepTime**: 期望入睡时间 (HH:mm)
    - **acTempPreference**: 期望空调温度 (摄氏度)
    - **noiseToleranceLevel**: 噪音耐受度等级 (1-5)
    """
    try:
        # TODO: 实现保存用户偏好到数据库的逻辑
        # 1. 检查用户是否存在
        # 2. 更新或创建偏好记录
        # 3. 返回保存结果

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


@router.get("/contrast-report")
async def get_contrast_report(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    获取"自报 vs 真实"偏好校准报告

    对比用户主观自报偏好与系统收集的客观行为数据
    """
    try:
        # TODO: 实现对比分析报告生成逻辑
        # 1. 获取用户显式偏好
        # 2. 分析IoT数据，生成隐式偏好
        # 3. 对比生成冲突标签和结论

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
    db: Session = Depends(get_db)
):
    """
    获取寝室时序冲突预警

    时序模型根据天气、课程表和历史行为，动态预测摩擦概率
    """
    try:
        # TODO: 实现冲突预测算法
        # 1. 获取历史行为数据
        # 2. 分析外部因素（天气、课程安排等）
        # 3. 计算冲突概率
        # 4. 生成预警信息

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
