#!/bin/bash

# Linux/macOS启动脚本

echo "寝室智能自治系统 - 快速启动脚本"
echo

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装/更新依赖..."
pip install -r requirements.txt

# 创建.env文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "创建.env文件..."
    cp .env.example .env
    echo "请编辑 .env 文件配置数据库连接"
fi

# 启动应用
echo
echo "启动应用..."
echo "应用将在 http://localhost:8000 运行"
echo "API文档: http://localhost:8000/docs"
echo

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
