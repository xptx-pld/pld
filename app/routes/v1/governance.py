"""
模块三：自治治理模块 API routes
"""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.shared import User
from app.schemas.request import (
    SyncIoTRulesRequest,
    ViolationRequest,
    NVCRequest
)
from app.utils.response_wrapper import ResponseWrapper
from datetime import datetime, timedelta
import os
import uuid
import shutil

router = APIRouter(prefix="/api/v1/governance", tags=["Governance"])

# 证据图片存储目录
EVIDENCE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "evidence")
os.makedirs(EVIDENCE_DIR, exist_ok=True)


@router.post("/upload-evidence")
async def upload_evidence(
    images: list[UploadFile] = File(...),
    user: User = Depends(get_current_user),
):
    """上传违约证据图片"""
    try:
        urls = []
        for image in images:
            ext = os.path.splitext(image.filename)[1] if image.filename else '.jpg'
            filename = f"{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(EVIDENCE_DIR, filename)

            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            urls.append(f"/uploads/evidence/{filename}")

        return ResponseWrapper.success(data={"urls": urls, "count": len(urls)}, message="证据图片上传成功")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/sync-iot-rules")
async def sync_iot_rules(
    request: SyncIoTRulesRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """同步公约规则至 IoT 自动化平台"""
    try:
        # TODO: 实现规则同步逻辑
        data = {
            "roomId": request.room_id,
            "rulesCount": len(request.rules),
            "synced": True,
            "message": "公约规则已同步至IoT自动化平台"
        }
        return ResponseWrapper.success(data=data)

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/violations")
async def report_violation(
    request: ViolationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """违约事件判定与寝室信用积分扣减"""
    try:
        # TODO: 实现违约处理逻辑
        data = {
            "userId": request.violator_id,
            "deductedPoints": 5,
            "remainingCreditScore": 85,
            "votingWeightModifier": 0.85,
            "broadcastNotice": "【寝室法庭通告】：监测到凌晨02:00床位A灯光异常开启，扣除室友A信用分5分。当前公约修订投票权重降至85%。",
            "evidenceImages": request.evidence_images or []
        }
        return ResponseWrapper.success(data=data, message="违约事件已记录并触发信用惩罚")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/revisions/initiate")
async def initiate_revision(
    room_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """发起新一轮公约迭代周期"""
    try:
        # TODO: 实现周期迭代初始化逻辑
        data = {
            "roomId": room_id,
            "cycleId": "CYC_2026_W20",
            "executionReport": {
                "totalViolationsRecorded": 3,
                "mostFrictionRule": "空调温度纠纷",
                "behaviorShiftTrend": "行为数据表明，室友B近两周入睡时间呈线性延后趋势，原公约平衡已打破。"
            },
            "voteSessionId": "VOTE_99012",
            "status": "AWAITING_RE_NEGOTIATION"
        }
        return ResponseWrapper.success(data=data, message="新周期公约迭代已就绪")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/covenant-history")
async def get_covenant_history(
    room_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取公约历史记录"""
    try:
        # TODO: 从数据库查询公约历史
        now = datetime.utcnow()
        history = [
            {
                "cycleId": "CYC_2026_W18",
                "status": "ACTIVE",
                "createdAt": (now - timedelta(days=2)).isoformat(),
                "plan": {
                    "planId": "P_NASH_05",
                    "type": "纳什解",
                    "rules": {
                        "acTemp": 25,
                        "lightsOffTime": "23:30",
                        "noisePolicy": "23:00后使用耳机",
                        "specialClause": "周三由室友A关灯"
                    }
                },
                "voteResult": {
                    "totalVoters": 4,
                    "agreeCount": 3,
                    "disagreeCount": 1,
                    "status": "PASSED"
                }
            },
            {
                "cycleId": "CYC_2026_W16",
                "status": "SUPERSEDED",
                "createdAt": (now - timedelta(days=16)).isoformat(),
                "plan": {
                    "planId": "P_KS_03",
                    "type": "KS解",
                    "rules": {
                        "acTemp": 26,
                        "lightsOffTime": "00:00",
                        "noisePolicy": "22:30后保持安静",
                        "specialClause": "无"
                    }
                },
                "voteResult": {
                    "totalVoters": 4,
                    "agreeCount": 4,
                    "disagreeCount": 0,
                    "status": "PASSED"
                }
            },
        ]
        return ResponseWrapper.success(data={
            "roomId": room_id,
            "history": history,
            "total": len(history),
        })

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/votes/active")
async def get_active_votes(
    room_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取治理相关的活跃投票"""
    try:
        # TODO: 从数据库查询治理相关投票
        now = datetime.utcnow()
        votes = [
            {
                "voteId": "VOTE_GOVERNANCE_01",
                "title": "公约修订投票: 熄灯时间调整",
                "description": "因室友B近期频繁晚归，提议将熄灯时间从23:00调整为23:30",
                "voteType": "REVISION",
                "status": "ACTIVE",
                "options": [
                    {"index": 0, "text": "同意调整为23:30", "vote_count": 2, "voter_ids": ["U_001", "U_002"]},
                    {"index": 1, "text": "保持23:00不变", "vote_count": 1, "voter_ids": ["U_003"]},
                    {"index": 2, "text": "调整为23:15", "vote_count": 0, "voter_ids": []},
                ],
                "totalVoters": 4,
                "totalVoted": 3,
                "createdAt": (now - timedelta(hours=6)).isoformat(),
                "expiresAt": (now + timedelta(hours=42)).isoformat(),
            },
        ]
        return ResponseWrapper.success(data={
            "votes": votes,
            "total": len(votes),
        })

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/mediation/nvc-generate")
async def generate_nvc_mediation(
    request: NVCRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """生成非暴力沟通 (NVC) 冲突调解话术"""
    try:
        # TODO: 实现NVC生成逻辑
        data = {
            "roomId": request.room_id,
            "mediationNarrative": "系统观察提示：『我注意到在过去一周，关于关灯与起夜噪音的问题发生了3次轻微摩擦。』",
            "suggestedTransitionalPlan": {
                "lightsOffTime": "23:30",
                "acTemp": 25,
                "specialClause": "B使用静音配件"
            }
        }
        return ResponseWrapper.success(data=data, message="NVC调解叙事话术生成成功")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))
