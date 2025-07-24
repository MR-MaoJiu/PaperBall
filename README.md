# 纸团社交应用 🎯

一个基于地理位置的创新社交应用，用户可以在特定位置"丢"纸团，其他用户可以在附近"捡"到这些纸团，创造有趣的地理社交体验。

## ✨ 功能特性

- 📍 **地理位置社交** - 基于真实地理位置的纸团投放和发现
- 📝 **多媒体内容** - 支持文本、图片等多种内容类型
- 👥 **用户系统** - 完整的用户注册、登录和个人资料管理
- 💬 **互动功能** - 纸团评论、点赞和社交互动
- 🔍 **智能搜索** - 附近纸团搜索和内容发现
- 📱 **响应式设计** - 完美支持桌面端和移动端
- ⚡ **实时体验** - 流畅的用户交互和即时反馈

## 🚀 快速体验

### 方式一：在线体验（推荐）

🌐 **在线演示**: [https://traevpvgvp1n-m8h3c5z8z-abandons-projects.vercel.app](https://traevpvgvp1n-m8h3c5z8z-abandons-projects.vercel.app)

应用已配置模拟 API，可以直接体验所有功能：
- 📧 **演示账号**: `demo@example.com`
- 🔑 **密码**: `demo123`

### 方式二：本地运行

1. **克隆项目**：
```bash
git clone <repository-url>
cd PaperBall
```

2. **安装依赖**：
```bash
npm install
```

3. **启动应用**：
```bash
npm run dev
```

4. **打开浏览器** 访问 `http://localhost:5173`

## 🎮 使用模拟 API

为了让用户能够立即体验完整功能，我们提供了内置的模拟 API：

### 配置模拟 API

在 `.env` 文件中设置：
```env
# 启用模拟 API（默认已启用）
VITE_USE_MOCK_API=true
```

### 模拟数据特性

- ✅ **完整用户系统** - 注册、登录、个人资料
- ✅ **纸团功能** - 发布、浏览、搜索纸团
- ✅ **社交互动** - 点赞、评论、关注
- ✅ **地理位置** - 模拟地理位置数据
- ✅ **实时反馈** - 模拟网络延迟和真实体验

### 演示账号

```
用户名: demo@example.com
密码: demo123
```

或者直接注册新账号体验完整注册流程。

## 🛠 技术栈

### 前端技术
- **React 18** + **TypeScript** - 现代化前端框架
- **Vite** - 极速构建工具
- **Tailwind CSS** - 原子化 CSS 框架
- **Zustand** - 轻量级状态管理
- **React Router** - 单页应用路由
- **Lucide React** - 精美图标库

### 后端技术
- **Node.js** + **Express** - 服务器框架
- **MySQL** - 关系型数据库
- **JWT** - 身份验证
- **Multer** - 文件上传处理
- **bcryptjs** - 密码加密

## 📁 项目结构

```
PaperBall/
├── 📂 src/                    # 前端源码
│   ├── 📂 components/         # 可复用组件
│   ├── 📂 pages/             # 页面组件
│   ├── 📂 hooks/             # 自定义 Hooks
│   ├── 📂 services/          # API 服务层
│   │   ├── 📄 api.ts         # 真实 API 接口
│   │   └── 📄 mockApi.ts     # 模拟 API 接口
│   ├── 📂 store/             # 状态管理
│   └── 📂 utils/             # 工具函数
├── 📂 server/                # 后端源码
│   ├── 📄 index.js          # 服务器入口
│   ├── 📄 Dockerfile        # Docker 配置
│   ├── 📄 render.yaml       # Render 部署配置
│   ├── 📄 railway.json      # Railway 部署配置
│   ├── 📄 vercel.json       # Vercel 部署配置
│   └── 📂 uploads/          # 文件上传目录
├── 📂 public/                # 静态资源
├── 📄 DEPLOYMENT.md          # 详细部署指南
├── 📄 .env.example          # 环境变量示例
├── 📄 .env                  # 环境变量配置
├── 📄 vercel.json           # 前端部署配置
└── 📄 package.json          # 项目依赖
```

## 🌐 部署指南

### 前端部署 ✅

前端已成功部署到 Vercel：
- 🔗 **生产地址**: [https://traevpvgvp1n-m8h3c5z8z-abandons-projects.vercel.app](https://traevpvgvp1n-m8h3c5z8z-abandons-projects.vercel.app)
- ⚡ **自动部署**: 推送到主分支自动触发部署
- 🔄 **环境变量**: 支持生产/开发环境配置

### 后端部署选项

详细的后端部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)，支持多种部署方式：

1. **🚀 Render** (推荐)
2. **🚄 Railway** 
3. **🐳 Docker**
4. **💻 本地开发**

#### 本地开发 💻

如果需要本地开发和测试：

```bash
# 1. 启动本地后端服务
cd server
npm install
npm start

# 2. 启动前端开发服务器
npm run dev

# 3. 访问应用
# 前端：http://localhost:5173
# 后端：http://localhost:3001
```

**本地开发优势：**
- ✅ 快速开发调试
- ✅ 完整功能测试
- ✅ 数据库直接访问
- ✅ 实时代码热更新
- ✅ 无网络依赖

### 环境配置

```env
# 模拟 API 开关
VITE_USE_MOCK_API=true          # 生产环境建议设为 false

# 后端 API 地址
VITE_API_BASE_URL=http://localhost:3001/api

# 应用配置
VITE_APP_TITLE=纸团社交
```

## 📦 项目清理说明

为了保持项目结构清晰，已移除以下不必要的文件：
- ❌ `deploy-to-glitch.js` - Glitch 部署脚本
- ❌ `glitch-package.json` - Glitch 配置文件
- ❌ `glitch-server.js` - Glitch 服务器文件
- ❌ `server/api/` - 重复的 API 目录
- ❌ `server/netlify/` - Netlify 函数目录
- ❌ `tsconfig.app.tsbuildinfo` - TypeScript 构建缓存
- ❌ `NGROK_GUIDE.md` - ngrok 内网穿透指南
- ❌ `setup-ngrok.sh` - ngrok 安装脚本

**当前项目结构更加简洁，专注于核心功能。**

## 🔧 开发指南

### 环境要求
- **Node.js** 16+ 
- **MySQL** 5.7+ (仅真实后端需要)
- **现代浏览器** (Chrome, Firefox, Safari, Edge)

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 开发工具推荐
- **VS Code** - 主要开发环境
- **React Developer Tools** - React 调试
- **Tailwind CSS IntelliSense** - CSS 智能提示
- **MySQL Workbench** - 数据库管理
- **Postman** - API 测试

## 📋 API 接口文档

### 用户相关
```
POST   /api/users/register     # 用户注册
POST   /api/users/login        # 用户登录  
GET    /api/users/me           # 获取当前用户
PUT    /api/users/profile      # 更新用户资料
```

### 纸团相关
```
POST   /api/papers             # 发布纸团
GET    /api/papers/nearby      # 获取附近纸团
GET    /api/papers/:id         # 获取纸团详情
POST   /api/papers/:id/like    # 点赞纸团
POST   /api/papers/:id/comments # 添加评论
```

### 媒体相关
```
POST   /api/media/upload       # 上传文件
GET    /api/health             # 健康检查
```

## 🎯 功能演示

### 核心功能
1. **📝 发布纸团** - 创建包含文本和图片的纸团
2. **🗺️ 地理发现** - 基于位置发现附近的纸团
3. **💬 社交互动** - 评论、点赞、关注其他用户
4. **🔍 内容搜索** - 搜索感兴趣的纸团内容
5. **👤 个人中心** - 管理个人资料和发布历史

### 用户体验
- ⚡ **快速响应** - 优化的加载速度和交互体验
- 🎨 **现代设计** - 简洁美观的用户界面
- 📱 **移动优先** - 完美的移动端适配
- 🌙 **主题支持** - 支持亮色/暗色主题切换

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. **Fork** 本仓库
2. **创建** 功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **创建** Pull Request

### 贡献类型
- 🐛 **Bug 修复**
- ✨ **新功能开发**
- 📚 **文档改进**
- 🎨 **UI/UX 优化**
- ⚡ **性能优化**
- 🧪 **测试覆盖**

## 📞 支持与反馈

- 📧 **问题反馈**: 通过 GitHub Issues
- 💡 **功能建议**: 通过 GitHub Discussions
- 📖 **文档问题**: 通过 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

**🎉 感谢使用纸团社交应用！** 

如果这个项目对你有帮助，请给我们一个 ⭐ Star！
