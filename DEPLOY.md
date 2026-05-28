# 部署指南

## 快速部署到服务器

### 1. 上传项目文件到服务器

```bash
# 在本地执行，将项目上传到服务器
scp -r . root@118.31.34.27:/opt/dormitory-system
```

或者使用 FTP 工具（如 FileZilla）将整个项目文件夹上传到服务器的 `/opt/dormitory-system` 目录。

### 2. SSH 登录服务器

```bash
ssh root@118.31.34.27
```

### 3. 进入项目目录并运行部署脚本

```bash
cd /opt/dormitory-system
chmod +x deploy.sh
./deploy.sh
```

### 4. 访问系统

部署完成后，访问：`http://118.31.34.27`

邀请码：`dorm2026` 或 `test123`

---

## 修改邀请码

编辑 `web/src/pages/GatePage.tsx` 文件，修改第 6 行：

```typescript
const VALID_CODES = ['dorm2026', 'test123']  // 修改为你的邀请码
```

然后重新部署：

```bash
cd /opt/dormitory-system
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 常用命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 更新代码后重新部署
git pull  # 如果用 git
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 防火墙配置

确保服务器开放了 80 端口：

```bash
# Ubuntu/Debian
ufw allow 80

# CentOS
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload
```
