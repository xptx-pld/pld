# 🔐 认证系统使用指南

## 功能概述

寝室自治系统实现了完整的**注册登录认证系统**，支持：

- ✅ **邮箱注册/登录** - 邮件OTP验证
- ✅ **电话号码注册/登录** - Redis OTP虚拟替代
- ✅ **JWT Token认证** - 双token（Access + Refresh）
- ✅ **Web和App双端支持** - 标准Bearer token认证

---

## 📦 系统依赖

系统已添加以下新依赖到 `requirements.txt`:

```
redis==5.0.1              # Redis客户端
PyJWT==2.8.1             # JWT token生成和验证
email-validator==2.1.0   # 邮件验证
pydantic-extra-types==2.4.1  # Pydantic扩展类型
bcrypt==4.1.1            # 密码哈希
aiosmtplib==3.0.1        # 异步SMTP
```

---

## ⚙️ 环境配置

### 1. 修改 `.env` 文件

```bash
# JWT认证配置
JWT_SECRET_KEY=your-super-secret-key-change-in-production-12345
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
REFRESH_TOKEN_EXPIRATION_DAYS=7

# Redis配置（用于OTP存储）
REDIS_URL=redis://localhost:6379/0
REDIS_OTP_TTL=600              # OTP有效期：10分钟
REDIS_OTP_MAX_ATTEMPTS=5       # 最多尝试5次

# 邮件配置（SMTP）
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password    # 不是密码，而是应用专用密码
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=寝室自治系统
```

### 2. 配置Gmail邮件服务

1. **启用两步验证**
   - 访问 https://myaccount.google.com/security
   - 启用两步验证

2. **生成应用专用密码**
   - 访问 https://support.google.com/accounts/answer/185833
   - 生成一个应用专用密码
   - 将其粘贴到 `.env` 中的 `SMTP_PASSWORD`

### 3. 启动Redis服务

```bash
# 如果已安装Redis
redis-server

# 或使用Docker
docker run -d -p 6379:6379 redis:latest
```

### 4. 初始化数据库

```bash
# 运行迁移或手动创建User表
# 确保MySQL中的users表已创建，新增字段：
# - phone (VARCHAR(20), UNIQUE)
# - password_hash (VARCHAR(255))
# - is_email_verified (BOOLEAN)
# - is_phone_verified (BOOLEAN)
```

---

## 🚀 API端点

### 邮箱注册流程

```
1. 发送邮箱 OTP
   POST /api/v1/auth/email/send-otp
   
2. 验证邮箱 OTP + 注册
   POST /api/v1/auth/email/register

3. 邮箱登录
   POST /api/v1/auth/email/login
```

### 电话号码注册流程

```
1. 发送电话 OTP
   POST /api/v1/auth/phone/send-otp
   
2. 验证电话 OTP + 注册
   POST /api/v1/auth/phone/register

3. 电话登录
   POST /api/v1/auth/phone/login
```

### Token管理

```
刷新 Token
POST /api/v1/auth/refresh

获取用户资料
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

---

## 📝 API使用示例

### 1. 邮箱注册（第一步：获取OTP）

```bash
curl -X POST "http://localhost:8000/api/v1/auth/email/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 响应
{
  "message": "验证码已发送，请查收邮件",
  "target": "user@example.com",
  "resend_in": 600
}
```

### 2. 邮箱注册（第二步：验证OTP和注册）

```bash
curl -X POST "http://localhost:8000/api/v1/auth/email/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "password": "SecurePassword123"
  }'

# 响应
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "uuid-here",
  "username": "user"
}
```

### 3. 邮箱登录

```bash
curl -X POST "http://localhost:8000/api/v1/auth/email/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'

# 响应
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "uuid-here",
  "username": "user"
}
```

### 4. 电话号码注册（第一步：获取OTP）

```bash
curl -X POST "http://localhost:8000/api/v1/auth/phone/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138000"}'

# 响应（虚拟模式 - 直接返回OTP用于测试）
{
  "message": "验证码（虚拟模式）: 123456",
  "target": "13800138000",
  "resend_in": 600
}
```

### 5. 电话号码注册（第二步：验证OTP和注册）

```bash
curl -X POST "http://localhost:8000/api/v1/auth/phone/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "otp": "123456",
    "password": "SecurePassword123"
  }'

# 响应
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "uuid-here",
  "username": "user_8000"
}
```

### 6. 刷新Token

```bash
curl -X POST "http://localhost:8000/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJhbGc..."}'

# 响应
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user_id": "uuid-here",
  "username": "user"
}
```

### 7. 获取用户资料

```bash
curl -X GET "http://localhost:8000/api/v1/auth/profile" \
  -H "Authorization: Bearer eyJhbGc..."

# 响应
{
  "user_id": "uuid-here",
  "username": "user",
  "email": "user@example.com",
  "phone": null,
  "credit_score": 100,
  "is_email_verified": true,
  "is_phone_verified": false,
  "created_at": "2024-05-18T10:30:00"
}
```

---

## 🛠️ 前端集成

### JavaScript/TypeScript 示例

```typescript
// 注册
async function register(email: string, password: string) {
  // 1. 获取OTP
  const otpResponse = await fetch('/api/v1/auth/email/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  // 2. 用户输入OTP
  const otp = prompt('请输入邮件中的OTP');

  // 3. 验证OTP并注册
  const registerResponse = await fetch('/api/v1/auth/email/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, password })
  });

  const { access_token, refresh_token } = await registerResponse.json();

  // 保存token
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
}

// 登录
async function login(email: string, password: string) {
  const response = await fetch('/api/v1/auth/email/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { access_token, refresh_token } = await response.json();

  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
}

// 获取用户资料
async function getProfile() {
  const token = localStorage.getItem('access_token');
  const response = await fetch('/api/v1/auth/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return await response.json();
}

// 刷新Token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  const { access_token, refresh_token } = await response.json();

  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
}
```

### React 示例

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000'
});

// 请求拦截器 - 添加Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理Token过期
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const { data } = await apiClient.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });
        localStorage.setItem('access_token', data.access_token);
        // 重试原请求
        return apiClient(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 移动App (React Native/Flutter) 示例

```typescript
// 存储Token
async function storeToken(token: string, refreshToken: string) {
  await AsyncStorage.setItem('access_token', token);
  await AsyncStorage.setItem('refresh_token', refreshToken);
}

// 获取Token
async function getToken() {
  return await AsyncStorage.getItem('access_token');
}

// API请求
async function apiCall(endpoint: string, options: any = {}) {
  const token = await getToken();
  const response = await fetch(`http://your-api.com${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

---

## 🔒 安全建议

### 生产环境

1. **更改JWT_SECRET_KEY**
   ```bash
   # 生成强密钥
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **启用HTTPS**
   - 所有认证请求必须使用HTTPS

3. **Token存储**
   - Web：使用HttpOnly Cookie（而不是localStorage）
   - Mobile：使用系统级密钥存储（Keychain/Keystore）

4. **速率限制**
   - 限制登录尝试
   - 限制OTP请求

5. **日志和监控**
   - 记录失败的登录尝试
   - 检测异常活动

---

## 📱 手机App 集成清单

- [ ] 实现邮箱/电话注册
- [ ] 实现登录页面
- [ ] 实现Token本地存储（安全存储）
- [ ] 实现Token过期自动刷新
- [ ] 实现用户资料展示
- [ ] 实现登出功能
- [ ] 实现网络错误重试机制
- [ ] 实现加载状态和错误提示

---

## 🐛 常见问题

### Redis连接失败

```
确保Redis正在运行：
redis-server

或使用Docker：
docker run -d -p 6379:6379 redis:latest
```

### 邮件发送失败

```
1. 检查SMTP配置
2. 检查应用专用密码是否正确
3. 检查防火墙/代理设置
4. Gmail账户是否启用了两步验证
```

### Token过期

```
使用refresh_token获取新的access_token：
POST /api/v1/auth/refresh
```

---

## 📚 下一步

1. ✅ 实现邮箱/电话认证 - **完成**
2. ⏳ 实现用户头像/个人资料编辑
3. ⏳ 实现邮箱/电话变更
4. ⏳ 实现密码重置
5. ⏳ 实现OAuth2社交登录
6. ⏳ 实现双因素认证(2FA)

---

需要帮助？查看 API 文档：http://localhost:8000/docs
