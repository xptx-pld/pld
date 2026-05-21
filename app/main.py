"""
主应用文件 - FastAPI 应用程序入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.config import settings
from app.routes.v1 import preferences, data_sources, insights, negotiation, governance, auth
from app.services.otp_service import otp_service
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 创建FastAPI应用
app = FastAPI(
    title=settings.app_name,
    description="寝室智能自治系统后端接口",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================== 生命周期事件 =====================

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    try:
        await otp_service.connect()
        print("✅ Redis连接成功")
    except Exception as e:
        print(f"❌ Redis连接失败: {str(e)}")
        # 继续运行，但功能会受限


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    try:
        await otp_service.disconnect()
        print("✅ Redis已断开")
    except Exception as e:
        print(f"⚠️ Redis断开失败: {str(e)}")


# ===================== 路由注册 =====================

# 认证模块
app.include_router(auth.router)

# 模块一：行为洞察模块
app.include_router(data_sources.router)
app.include_router(insights.router)

# 模块二：博弈论协商模块
app.include_router(negotiation.router)

# 模块三：治理自治模块
app.include_router(governance.router)


# ===================== 静态文件和Favicon =====================

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Favicon端点 - 返回204避免404错误"""
    return Response(status_code=204)


@app.get("/health", tags=["Health"])
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": "1.0.0"
    }



# ===================== 健康检查端点 =====================

@app.get("/", tags=["Health"])
async def root():
    """根端点 - API信息"""
    return {
        "code": 200,
        "message": "欢迎使用寝室智能自治系统",
        "data": {
            "appName": settings.app_name,
            "version": "1.0.0",
            "apiVersion": settings.api_version,
            "docs": "/docs",
            "healthcheck": "/health"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """健康检查端点"""
    return {
        "code": 200,
        "message": "系统正常运行",
        "data": {
            "status": "healthy",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat()
        }
    }


# ===================== 异常处理 =====================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    return {
        "code": 500,
        "message": "服务端系统内部异常",
        "data": {
            "error": str(exc)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.debug
    )
