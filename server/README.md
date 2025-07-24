# 纸团后端服务器

## 数据库迁移说明

本项目已从 SQLite 迁移到 MySQL 数据库。

## 环境配置

1. 复制环境配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置你的 MySQL 数据库连接信息：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=paperball
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

## MySQL 数据库设置

1. 确保你已安装 MySQL 服务器
2. 创建数据库：
```sql
CREATE DATABASE paperball;
```

3. 服务器启动时会自动创建所需的表结构

## 安装依赖

```bash
npm install
```

## 启动服务器

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 端点

- `GET /api/health` - 健康检查
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/upload` - 上传媒体文件
- `POST /api/papers` - 丢纸团
- `GET /api/papers/nearby` - 搜索附近纸团
- `GET /api/papers/:id` - 获取纸团详情
- `POST /api/papers/:id/like` - 点赞纸团
- `POST /api/papers/:id/comments` - 添加评论
- `GET /api/users/:id/papers` - 获取用户纸团
- `PUT /api/users/:id/avatar` - 更新用户头像

## 数据库表结构

### users 表
- id (VARCHAR(36), PRIMARY KEY)
- username (VARCHAR(50), UNIQUE)
- password (VARCHAR(255))
- nickname (VARCHAR(50))
- avatar (VARCHAR(255))
- created_at (TIMESTAMP)

### papers 表
- id (VARCHAR(36), PRIMARY KEY)
- content (TEXT)
- type (VARCHAR(20))
- media_url (VARCHAR(255))
- author_id (VARCHAR(36))
- author_nickname (VARCHAR(50))
- author_avatar (VARCHAR(255))
- latitude (DECIMAL(10,8))
- longitude (DECIMAL(11,8))
- created_at (TIMESTAMP)

### comments 表
- id (VARCHAR(36), PRIMARY KEY)
- paper_id (VARCHAR(36))
- content (TEXT)
- author_id (VARCHAR(36))
- author_nickname (VARCHAR(50))
- author_avatar (VARCHAR(255))
- created_at (TIMESTAMP)

### likes 表
- id (VARCHAR(36), PRIMARY KEY)
- paper_id (VARCHAR(36))
- user_id (VARCHAR(36))
- created_at (TIMESTAMP)