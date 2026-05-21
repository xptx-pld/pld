@echo off
REM Windows启动脚本

echo 寝室智能自治系统 - 快速启动脚本
echo.

REM 检查虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
echo 激活虚拟环境...
call venv\Scripts\activate.bat

REM 安装依赖
echo 安装/更新依赖...
pip install -r requirements.txt

REM 创建.env文件（如果不存在）
if not exist ".env" (
    echo 创建.env文件...
    copy .env.example .env
    echo 请编辑 .env 文件配置数据库连接
)

REM 启动应用
echo.
echo 启动应用...
echo 应用将在 http://localhost:8000 运行
echo API文档: http://localhost:8000/docs
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
