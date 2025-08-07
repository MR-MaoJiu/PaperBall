# 纸团社交应用部署指南

## 前端部署

前端已成功部署到 Vercel：
- 🌐 **生产环境地址**: https://traevpvgvp1n-m8h3c5z8z-abandons-projects.vercel.app
- 🔧 **技术栈**: React + TypeScript + Vite + Tailwind CSS

## 后端部署选项

### 选项 1: 使用 Render (推荐)

1. 访问 [Render.com](https://render.com) 并注册账号
2. 连接你的 GitHub 仓库
3. 创建新的 Web Service
4. 选择 `server` 目录作为根目录
5. 设置以下环境变量：
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=<your_mysql_host>
   DB_PORT=3306
   DB_USER=<your_mysql_user>
   DB_PASSWORD=<your_mysql_password>
   DB_NAME=paperball
   JWT_SECRET=<your_jwt_secret>
   ```
6. 部署完成后，更新前端 `src/services/api.ts` 中的 API 地址

### 选项 2: 使用 Railway

1. 访问 [Railway.app](https://railway.app) 并注册账号
2. 创建新项目并连接 GitHub 仓库
3. 添加 MySQL 数据库服务
4. 设置环境变量（同上）
5. 部署后端服务

### 选项 3: 使用 Docker (本地或云服务器)

1. 确保已安装 Docker 和 Docker Compose
2. 在 `server` 目录下运行：
   ```bash
   docker build -t paperball-backend .
   docker run -p 3001:3001 \
     -e DB_HOST=<your_mysql_host> \
     -e DB_USER=<your_mysql_user> \
     -e DB_PASSWORD=<your_mysql_password> \
     -e DB_NAME=paperball \
     -e JWT_SECRET=<your_jwt_secret> \
     paperball-backend
   ```

### 选项 4: 本地开发 + 内网穿透 (推荐用于测试)

如果只是测试，可以保持后端在本地运行并使用内网穿透：

#### 使用 Cloudflare Tunnel (推荐)

1. 安装 cloudflared：
   ```bash
   # macOS
   brew install cloudflared
   
   # 或者下载安装包
   # https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. 启动后端服务：
   ```bash
   cd server
   npm install
   npm start
   ```

3. 在新终端中启动 cloudflared：
   ```bash
   cloudflared tunnel --url http://127.0.0.1:3001
   ```

4. 复制 cloudflared 提供的 HTTPS 地址（如：`https://abc-def-ghi.trycloudflare.com`）

5. 更新前端环境变量：
   ```bash
   # 编辑 .env 文件
   VITE_USE_MOCK_API=false
   VITE_API_BASE_URL=https://abc-def-ghi.trycloudflare.com
   ```

6. 重启前端开发服务器：
   ```bash
   npm run dev
   ```

**Cloudflare Tunnel 优势**：
- ✅ 无需注册账号
- ✅ 无需密码验证
- ✅ 自动 HTTPS 支持
- ✅ 全球 CDN 加速
- ✅ 完全免费
- ✅ 连接更稳定

#### 纯本地开发

如果不需要外网访问：

1. 在 `server` 目录下运行：
   ```bash
   npm install
   npm start
   ```
2. 确保 MySQL 数据库正在运行
3. 前端会自动连接到 `http://localhost:3001`

## 数据库配置

### MySQL 数据库要求

- MySQL 5.7+ 或 8.0+
- 创建数据库 `paperball`
- 应用会自动创建所需的表结构

### 环境变量说明

```env
# MySQL数据库配置
DB_HOST=localhost          # 数据库主机地址
DB_PORT=3306              # 数据库端口
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password  # 数据库密码
DB_NAME=paperball         # 数据库名称

# JWT密钥（请使用强密码）
JWT_SECRET=your_very_secure_secret_key

# 服务器端口
PORT=3001
```

## 更新前端 API 地址

部署后端后，需要更新前端的 API 配置：

1. 编辑 `src/services/api.ts`
2. 将生产环境的 API 地址更新为你的后端部署地址：
   ```typescript
   const API_BASE_URL = import.meta.env.PROD 
     ? 'https://your-backend-url.com/api' // 替换为你的后端地址
     : 'http://localhost:3001/api';
   ```
3. 重新部署前端到 Vercel

## 功能特性

✅ **已实现功能**:
- 用户注册/登录
- JWT 身份验证
- 发布纸团（文本、图片）
- 基于地理位置的纸团搜索
- 纸团详情查看
- 评论功能
- 点赞功能
- 响应式设计
- 时间格式化显示

## 技术栈

**前端**:
- React 18 + TypeScript
- Vite (构建工具)
- Tailwind CSS (样式)
- Zustand (状态管理)
- React Router (路由)
- Lucide React (图标)

**后端**:
- Node.js + Express
- MySQL (数据库)
- JWT (身份验证)
- Multer (文件上传)
- bcryptjs (密码加密)

## 故障排除

### 常见问题

1. **CORS 错误**: 确保后端的 CORS 配置包含了前端域名
2. **数据库连接失败**: 检查数据库配置和网络连接
3. **JWT 验证失败**: 确保 JWT_SECRET 在前后端保持一致
4. **文件上传失败**: 确保 uploads 目录存在且有写权限

### 日志查看

- 前端：浏览器开发者工具 Console
- 后端：服务器日志或容器日志

## 联系支持

如有问题，请检查：
1. 环境变量配置是否正确
2. 数据库连接是否正常
3. 网络防火墙设置
4. 服务器资源是否充足

---

**注意**: 这是一个演示项目，生产环境使用时请确保：
- 使用强密码和安全的 JWT 密钥
- 配置适当的数据库备份
- 设置监控和日志记录
- 考虑使用 HTTPS 和其他安全措施