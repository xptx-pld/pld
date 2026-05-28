#!/bin/bash
# 部署脚本 - 在服务器上运行

set -e

echo "=== 寝室自治系统部署脚本 ==="

# 1. 安装 Docker（如果没有）
if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 2. 安装 Docker Compose（如果没有）
if ! command -v docker-compose &> /dev/null; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 3. 创建环境变量文件
cat > .env << EOF
DATABASE_URL=mysql+mysqlconnector://recon_user:Recon%402026@mysql.xyyxt.xyz:3306/reconciliation_system
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=false
JWT_SECRET_KEY=dormitory-autonomy-secret-key-$(date +%s)
REDIS_URL=
DB_PASSWORD=unused
PORT=80
EOF

# 4. 先初始化数据库（创建表）
echo "初始化数据库..."
docker run --rm \
    -e DATABASE_URL="mysql+mysqlconnector://recon_user:Recon%402026@mysql.xyyxt.xyz:3306/reconciliation_system" \
    $(docker build -q .) \
    python init_db.py

# 5. 构建并启动
echo "构建并启动服务..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=== 部署完成 ==="
echo "访问: http://$(curl -s ifconfig.me)"
echo "邀请码: dorm2026 或 test123"
