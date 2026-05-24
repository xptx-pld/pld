"""
模块三：自治治理模块 API routes
"""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
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
):
    """
    上传违约证据图片

    返回图片的访问URL列表
    """
    try:
        urls = []
        for image in images:
            # Generate unique filename
            ext = os.path.splitext(image.filename)[1] if image.filename else '.jpg'
            filename = f"{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(EVIDENCE_DIR, filename)

            # Save file
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            # Store relative URL
            urls.append(f"/uploads/evidence/{filename}")

        return ResponseWrapper.success(data={"urls": urls, "count": len(urls)}, message="证据图片上传成功")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/sync-iot-rules")
async def sync_iot_rules(
    request: SyncIoTRulesRequest,
    db: Session = Depends(get_db)
):
    """
    同步公约规则至 IoT 自动化平台

    将通过博弈确定的公约细节直接写入后台定时任务或下发至智能家居总控平台。
    """
    try:
        # TODO: 实现规则同步逻辑
        # 1. 解析规则配置
        # 2. 验证规则合法性
        # 3. 下发到IoT平台/定时任务系统
        # 4. 返回同步结果

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
    db: Session = Depends(get_db)
):
    """
    违约事件判定与寝室信用积分扣减

    智能物联监测终端或用户上传的明确证据触发此接口。
    系统自动发布"寝室法庭通告"并扣减相应人员的信用积分。
    """
    try:
        # TODO: 实现违约处理逻辑
        # 1. 记录违约事件
        # 2. 计算扣分
        # 3. 更新用户信用分和投票权重
        # 4. 生成法庭通告

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
    db: Session = Depends(get_db)
):
    """
    发起新一轮公约迭代周期

    系统默认每两周自动发起一次公约修正提案。
    结合本期执行报告，开启新一轮博弈与投票表决。
    """
    try:
        # TODO: 实现周期迭代初始化逻辑
        # 1. 生成执行报告
        # 2. 分析行为数据变化趋势
        # 3. 创建新迭代周期
        # 4. 初始化投票会话

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
    db: Session = Depends(get_db)
):
    """
    获取公约历史记录

    返回寝室的公约迭代历史，包括每次修订的内容、投票结果等
    """
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
                        "lightsOffTime": "23:00",
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
            {
                "cycleId": "CYC_2026_W14",
                "status": "SUPERSEDED",
                "createdAt": (now - timedelta(days=30)).isoformat(),
                "plan": {
                    "planId": "P_FRONT_01",
                    "type": "初始公约",
                    "rules": {
                        "acTemp": 24,
                        "lightsOffTime": "23:00",
                        "noisePolicy": "22:00后保持安静",
                        "specialClause": "无"
                    }
                },
                "voteResult": {
                    "totalVoters": 4,
                    "agreeCount": 4,
                    "disagreeCount": 0,
                    "status": "PASSED"
                }
            }
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
    db: Session = Depends(get_db)
):
    """
    获取治理相关的活跃投票

    返回与公约修订、违约申诉等相关的进行中投票
    """
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
            {
                "voteId": "VOTE_GOVERNANCE_02",
                "title": "违约申诉投票: 室友A噪音事件",
                "description": "室友A对5月18日的噪音违约提出申诉，认为当天是特殊情况",
                "voteType": "APPEAL",
                "status": "ACTIVE",
                "options": [
                    {"index": 0, "text": "撤销违约记录", "vote_count": 1, "voter_ids": ["U_001"]},
                    {"index": 1, "text": "维持原判", "vote_count": 2, "voter_ids": ["U_002", "U_004"]},
                ],
                "totalVoters": 4,
                "totalVoted": 3,
                "createdAt": (now - timedelta(hours=18)).isoformat(),
                "expiresAt": (now + timedelta(hours=30)).isoformat(),
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
    db: Session = Depends(get_db)
):
    """
    生成非暴力沟通 (NVC) 冲突调解话术

    当系统检测到频繁违约时，调用内置 LLM 引擎自动捕获摩擦因子，
    生成柔性、去情绪化的非暴力沟通调解引导叙事，打破寝室冷战或激化对抗。
    """
    try:
        # TODO: 实现NVC生成逻辑
        # 1. 分析冲突背景和参与方
        # 2. 调用LLM生成调解叙事
        # 3. 建议过渡方案

        data = {
            "roomId": request.room_id,
            "mediationNarrative": "系统观察提示：『我注意到在过去一周，关于关灯与起夜噪音的问题发生了3次轻微摩擦。我猜，[室友A]可能最近由于期末评测比较疲惫需要充足睡眠，而[室友B]可能因为深夜赶项目对光线与键盘声感到有些愧疚和焦虑。为了维护我们长期的公共信任，大家是否愿意尝试接受这样一个由算法推演的过渡方案：23:30后关闭寝室大灯，室友B切换到专属床头微光模式并佩戴静音键盘套？』",
            "suggestedTransitionalPlan": {
                "lightsOffTime": "23:30",
                "acTemp": 25,
                "specialClause": "B使用静音配件"
            }
        }
        return ResponseWrapper.success(data=data, message="NVC调解叙事话术生成成功")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))
