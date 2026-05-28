"""
模块二：博弈论协商模块 API routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.shared import User
from app.schemas.request import CommitPlanRequest, CreateVoteRequest, CastVoteRequest
from app.utils.response_wrapper import ResponseWrapper
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/v1/negotiation", tags=["Negotiation"])


@router.get("/pareto-frontier")
async def get_pareto_frontier(
    room_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取帕累托前沿数据点 (Pareto Frontier)"""
    try:
        # TODO: 实现帕累托前沿计算
        frontier_data = {
            "roomId": room_id,
            "dimensions": ["UserA_Satisfaction", "UserB_Satisfaction"],
            "points": [
                {
                    "planId": "P_FRONT_01",
                    "satisfactionVector": [9.5, 4.0],
                    "details": {"acTemp": 24, "lightsOffTime": "23:00"}
                },
                {
                    "planId": "P_FRONT_02",
                    "satisfactionVector": [7.0, 7.5],
                    "details": {"acTemp": 25, "lightsOffTime": "23:30"}
                },
                {
                    "planId": "P_FRONT_03",
                    "satisfactionVector": [3.5, 9.8],
                    "details": {"acTemp": 27, "lightsOffTime": "00:30"}
                }
            ]
        }
        return ResponseWrapper.success(data=frontier_data)

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/optimal-solutions")
async def get_optimal_solutions(
    room_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取博弈最优解 (纳什谈判解 & KS解)"""
    try:
        # TODO: 实现Nash和Kalai-Smorodinsky解的计算
        solutions = {
            "roomId": room_id,
            "nashSolution": {
                "planId": "P_NASH_05",
                "mathematicalBasis": "Maximize U_A * U_B",
                "description": "纳什博弈解（各方效用乘积最大化点，理性的最优折中方案）",
                "details": {"acTemp": 25, "lightsOffTime": "23:30"}
            },
            "kalaiSmarodinskySolution": {
                "planId": "P_KS_07",
                "mathematicalBasis": "Proportional to Ideal Maximum Payoff",
                "description": "卡莱-斯莫罗丁斯基解（考虑每个人最大可能委屈程度的等比例比例补偿方案）",
                "details": {
                    "acTemp": 26,
                    "lightsOffTime": "00:00",
                    "supplementary": "由A在周三额外承担关灯义务"
                }
            }
        }
        return ResponseWrapper.success(data=solutions)

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/commit-plan")
async def commit_plan(
    request: CommitPlanRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """提交最终协商方案"""
    try:
        # TODO: 实现方案提交和保存逻辑
        data = {
            "roomId": request.room_id,
            "chosenPlanId": request.chosen_plan_id,
            "agreedUserIds": request.agreed_user_ids,
            "status": "committed",
            "message": "方案已提交，即将同步至物联网平台"
        }
        return ResponseWrapper.success(data=data, message="协商方案已保存")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


# ==================== 投票相关接口 ====================

@router.post("/votes/create")
async def create_vote(
    request: CreateVoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """创建投票"""
    try:
        vote_id = f"VOTE_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=request.expires_in_hours)

        vote_options = []
        for i, opt_text in enumerate(request.options):
            vote_options.append({
                "index": i,
                "text": opt_text,
                "vote_count": 0,
                "voter_ids": []
            })

        data = {
            "voteId": vote_id,
            "roomId": request.room_id,
            "title": request.title,
            "description": request.description,
            "voteType": request.vote_type,
            "status": "ACTIVE",
            "options": vote_options,
            "totalVoters": 4,
            "totalVoted": 0,
            "relatedPlanId": request.related_plan_id,
            "createdAt": now.isoformat(),
            "expiresAt": expires_at.isoformat(),
            "result": None,
        }
        return ResponseWrapper.success(data=data, message="投票已创建")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/votes/list")
async def list_votes(
    room_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取寝室投票列表"""
    try:
        # TODO: 从数据库查询投票记录
        now = datetime.utcnow()
        sample_votes = [
            {
                "voteId": "VOTE_DEMO01",
                "roomId": room_id,
                "title": "空调温度方案投票",
                "description": "请在以下方案中选出本周空调温度公约",
                "voteType": "PLAN",
                "status": "ACTIVE",
                "options": [
                    {"index": 0, "text": "方案A: 24°C (纳什解)", "vote_count": 1, "voter_ids": ["U_001"]},
                    {"index": 1, "text": "方案B: 25°C (折中)", "vote_count": 2, "voter_ids": ["U_002", "U_003"]},
                    {"index": 2, "text": "方案C: 26°C (KS解)", "vote_count": 0, "voter_ids": []},
                ],
                "totalVoters": 4,
                "totalVoted": 3,
                "relatedPlanId": "P_NASH_05",
                "createdAt": (now - timedelta(hours=12)).isoformat(),
                "expiresAt": (now + timedelta(hours=36)).isoformat(),
                "result": None,
            },
        ]
        return ResponseWrapper.success(data={
            "votes": sample_votes,
            "total": len(sample_votes),
        })

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.post("/votes/cast")
async def cast_vote(
    request: CastVoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """投票"""
    try:
        # TODO: 保存投票记录到数据库
        data = {
            "voteId": request.vote_id,
            "voterId": request.voter_id or user.user_id,
            "optionIndex": request.option_index,
            "status": "recorded",
            "message": "投票已记录",
        }
        return ResponseWrapper.success(data=data, message="投票成功")

    except Exception as e:
        return ResponseWrapper.server_error(str(e))


@router.get("/votes/{vote_id}")
async def get_vote_detail(
    vote_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取投票详情"""
    try:
        # TODO: 从数据库查询投票详情
        now = datetime.utcnow()
        data = {
            "voteId": vote_id,
            "roomId": "R_401",
            "title": "空调温度方案投票",
            "description": "请在以下方案中选出本周空调温度公约",
            "voteType": "PLAN",
            "status": "ACTIVE",
            "options": [
                {"index": 0, "text": "方案A: 24°C (纳什解)", "vote_count": 1, "voter_ids": ["U_001"]},
                {"index": 1, "text": "方案B: 25°C (折中)", "vote_count": 2, "voter_ids": ["U_002", "U_003"]},
                {"index": 2, "text": "方案C: 26°C (KS解)", "vote_count": 0, "voter_ids": []},
            ],
            "totalVoters": 4,
            "totalVoted": 3,
            "relatedPlanId": "P_NASH_05",
            "createdAt": (now - timedelta(hours=12)).isoformat(),
            "expiresAt": (now + timedelta(hours=36)).isoformat(),
            "result": None,
        }
        return ResponseWrapper.success(data=data)

    except Exception as e:
        return ResponseWrapper.server_error(str(e))
