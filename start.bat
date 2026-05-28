@echo off
REM 同时启动前端和后端

echo 寝室智能自治系统 - 同时启动前端和后端
echo.

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 启动后端（新窗口）
echo 启动后端服务...
start "后端服务" cmd /k "cd /d %cd% && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM 启动前端（新窗口）
echo 启动前端服务...
start "前端服务" cmd /k "cd /d %cd%\web && npm run dev"

echo.
echo 前后端服务已在新窗口启动
echo 后端: http://localhost:8000
echo 前端: http://localhost:5173
echo.
pause
