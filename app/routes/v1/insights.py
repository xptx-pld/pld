"""
行为洞察接口 API routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.response_wrapper import ResponseWrapper

router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


@router.get("/contrast-report")
async def get_contrast_report(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    获取"自报 vs 真实"偏好校准报告

    通过对比用户主观自报偏好与系统收集的客观行为数据，
    生成对比分析报告，揭示隐性行为特征。
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
    db: Session = Depends(get_db)
):
    """
    获取寝室时序冲突预警

    时序模型根据未来一周的天气变化趋势、校园课程表以及历史行为规律，
    动态预测摩擦概率。
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
