# 寝室智能自治系统（Dormitory Autonomy System）

## 项目概述

寝室智能自治系统是一个基于数据深度、算法深度和系统深度三层核心架构的后端解决方案。通过物联网联动、博弈论算法和大语言模型驱动的非暴力沟通机制，将传统静态的寝室公约转化为动态运行的微型社会治理自治系统。

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│        数据深度：行为洞察与冲突预测                      │
├─────────────────────────────────────────────────────────┤
│        算法深度：博弈论权衡与可视化                      │
├─────────────────────────────────────────────────────────┤
│        系统深度：自治闭环与动态修正                      │
└─────────────────────────────────────────────────────────┘
```

## 技术栈

- **后端框架**: FastAPI 0.104.1
- **Web服务器**: Uvicorn 0.24.0
- **数据库**: MySQL 8.0+
- **ORM**: SQLAlchemy 2.0.23
- **数据验证**: Pydantic 2.5.0
- **环境管理**: Python-dotenv 1.0.0

## 项目结构

```
寝室公约器/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI应用入口
│   ├── config.py                        # 应用配置
│   ├── database.py                      # 数据库连接配置
│   ├── models/                          # SQLAlchemy模型
│   │   ├── __init__.py
│   │   └── shared.py                    # 数据模型定义
│   ├── schemas/                         # Pydantic数据验证模型
│   │   ├── __init__.py
│   │   └── request.py                   # 请求/响应数据模型
│   ├── routes/                          # API路由
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── data_sources.py          # IoT数据源接口
│   │       ├── insights.py              # 行为洞察接口
│   │       ├── negotiation.py           # 博弈论协商接口
│   │       └── governance.py            # 治理自治接口
│   ├── services/                        # 业务逻辑服务层
│   │   └── __init__.py
│   └── utils/                           # 工具函数
│       ├── __init__.py
│       ├── response_wrapper.py          # 统一响应包装器
│       └── constants.py                 # 常量和枚举
├── requirements.txt                     # Python依赖
├── .env.example                         # 环境变量示例
├── docker-compose.yml                   # Docker容器编排
└── README.md                            # 本文件
```

## 快速开始

### 1. 环境设置

```bash
# 克隆项目（如果使用git）
git clone <repository_url>
cd 寝室公约器

# 创建Python虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，配置数据库连接
# DATABASE_URL=mysql+mysqlconnector://root:password@localhost:3306/dormitory_autonomy_db
```

### 4. 数据库初始化

```bash
# 使用Docker Compose启动MySQL（可选）
docker-compose up -d

# 或者使用本地MySQL，确保数据库已创建
# CREATE DATABASE dormitory_autonomy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 创建数据库表

```bash
python -c "
from app.database import engine, Base
from app.models import *
Base.metadata.create_all(bind=engine)
print('数据库表创建成功！')
"
```

### 6. 启动应用

```bash
# 开发模式（热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或者直接运行
python app/main.py
```

应用将在 `http://localhost:8000` 启动

## API文档

### 自动文档

启动应用后，访问以下URL：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API端点总览

#### 模块一：行为洞察与数据深度

| 方法 | 端点 | 功能 |
|-----|------|------|
| POST | `/api/v1/data-sources/iot-webhook` | 接收IoT设备数据 |
| GET | `/api/v1/insights/contrast-report` | 获取自报vs真实对比报告 |
| GET | `/api/v1/insights/conflict-prediction` | 获取冲突预警 |

#### 模块二：博弈论与权衡

| 方法 | 端点 | 功能 |
|-----|------|------|
| GET | `/api/v1/negotiation/pareto-frontier` | 获取帕累托前沿 |
| GET | `/api/v1/negotiation/optimal-solutions` | 获取最优解（Nash & KS） |
| POST | `/api/v1/negotiation/commit-plan` | 提交最终协商方案 |

#### 模块三：自治治理

| 方法 | 端点 | 功能 |
|-----|------|------|
| POST | `/api/v1/governance/sync-iot-rules` | 同步IoT规则 |
| POST | `/api/v1/governance/violations` | 上报违约事件 |
| POST | `/api/v1/governance/revisions/initiate` | 发起公约迭代周期 |
| POST | `/api/v1/governance/mediation/nvc-generate` | 生成NVC调解话术 |

## 数据库设计

### 核心表结构

- **users**: 用户信息
- **rooms**: 房间信息
- **preferences**: 用户偏好（显式和隐式）
- **iot_data**: IoT传感器数据
- **violations**: 违约事件记录
- **covenant_plans**: 寝室公约方案
- **governance_revisions**: 治理周期修订

详见 `app/models/shared.py`

## 响应格式

所有API响应遵循统一格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

**状态码说明：**
- `200`: 成功
- `400`: 客户端参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务端异常

## 开发指南

### 添加新的API端点

1. **创建数据模型** (如需要)
   - 在 `app/models/shared.py` 中定义SQLAlchemy模型

2. **定义Pydantic Schema**
   - 在 `app/schemas/request.py` 中定义请求/响应模型

3. **实现业务逻辑**
   - 在 `app/services/` 中创建服务类

4. **创建路由**
   - 在 `app/routes/v1/` 中创建或修改路由模块
   - 使用 `ResponseWrapper` 包装响应

5. **注册路由**
   - 在 `app/main.py` 中使用 `app.include_router()` 注册

### 代码规范

- 使用类型提示（Type Hints）
- 添加docstring文档
- 遵循PEP 8风格指南
- 使用统一的响应包装器

## Docker部署

### 使用Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 环境变量配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | - | MySQL数据库连接字符串 |
| `SERVER_HOST` | 0.0.0.0 | 服务器绑定地址 |
| `SERVER_PORT` | 8000 | 服务器端口 |
| `DEBUG` | true | 调试模式 |
| `API_VERSION` | v1 | API版本 |
| `APP_NAME` | Dormitory Autonomy System | 应用名称 |

## 扩展计划

1. **AI智能申诉仲裁** - 允许用户对违约事件进行申诉，由AI进行人性化豁免判定
2. **正和博弈代币机制** - 引入激励代币系统，将零和博弈转换为正和激励

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request！

## 支持

遇到问题？请创建Issue或联系开发团队。

---

**最后更新**: 2026年5月18日  
**版本**: 1.0.0-alpha
