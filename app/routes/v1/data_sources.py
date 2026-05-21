"""
IoT数据源接口 API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.request import IoTWebhookRequest
from app.utils.response_wrapper import ResponseWrapper

router = APIRouter(prefix="/api/v1/data-sources", tags=["Data Sources"])


@router.post("/iot-webhook")
async def iot_webhook(
    request: IoTWebhookRequest,
    db: Session = Depends(get_db)
):
    """
    外部行为数据上报 Webhook

    接收智能插座、智能空调日志以及群聊频次数据流

    - **roomId**: 物联网设备或群聊所在的房间ID
    - **deviceType**: 数据源类型 (SMART_AC / SMART_PLUG / CHAT_METRIC)
    - **action**: 发生的动作 (TEMP_CHANGE / POWER_TOGGLE / HIGH_FREQUENCY_CHAT)
    - **value**: 具体数值
    - **operatorId**: 操作人ID (可选)
    - **timestamp**: 事件时间戳 (ISO 8601格式)
    """
    try:
        # TODO: 实现IoT数据接收和存储逻辑
        # 1. 验证请求数据格式
        # 2. 存储到IoT数据表
        # 3. 触发实时分析（如高频行为检测）
        # 4. 更新隐式偏好模型

        data = {
            "roomId": request.room_id,
            "deviceType": request.device_type,
            "action": request.action,
            "timestamp": request.timestamp,
            "recorded": True
        }
        return ResponseWrapper.success(data=data, message="数据已记录")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))
