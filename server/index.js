require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'paper-ball-secret-key';

// 中间件
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://traevpvgvp1n-m8h3c5z8z-abandons-projects.vercel.app', 'https://traevpvgvp1n.vercel.app', 'https://traevpvgvp1n-dy1tol5u3-abandons-projects.vercel.app']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', /\.trycloudflare\.com$/],
  credentials: true,
  optionsSuccessStatus: 200
};

// 开发环境允许所有cloudflare tunnel域名
if (process.env.NODE_ENV !== 'production') {
  corsOptions.origin = function (origin, callback) {
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    // 允许localhost、cloudflare tunnel域名和vercel域名
    if (origin.includes('localhost') || origin.includes('.trycloudflare.com') || origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  };
}

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// 确保uploads目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// MySQL数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'paperball',
  port: process.env.DB_PORT || 3306
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 初始化数据库表
async function initDatabase() {
  try {
    console.log('正在连接MySQL数据库...');
    const connection = await pool.getConnection();
    console.log('MySQL数据库连接成功');
    
    // 用户表
    await connection.execute(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      nickname VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255) DEFAULT 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 纸团表
    await connection.execute(`CREATE TABLE IF NOT EXISTS papers (
      id VARCHAR(36) PRIMARY KEY,
      content TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      media_url VARCHAR(255),
      author_id VARCHAR(36) NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      likes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users (id)
    )`);

    // 评论表
    await connection.execute(`CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(36) PRIMARY KEY,
      paper_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      author_id VARCHAR(36) NOT NULL,
      parent_id VARCHAR(36) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paper_id) REFERENCES papers (id),
      FOREIGN KEY (author_id) REFERENCES users (id),
      FOREIGN KEY (parent_id) REFERENCES comments (id)
    )`);

    // 消息表
    await connection.execute(`CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type ENUM('comment', 'reply', 'like') NOT NULL,
      paper_id VARCHAR(36) NOT NULL,
      comment_id VARCHAR(36) DEFAULT NULL,
      from_user_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (paper_id) REFERENCES papers (id),
      FOREIGN KEY (comment_id) REFERENCES comments (id),
      FOREIGN KEY (from_user_id) REFERENCES users (id)
    )`);
    
    // 更新现有messages表的type字段以支持'like'类型
    try {
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN type ENUM('comment', 'reply', 'like') NOT NULL`);
    } catch (alterError) {
      // 如果ALTER失败，可能是因为表不存在或字段已经是正确的类型
      console.log('消息表type字段更新:', alterError.message);
    }

    // 点赞表
    await connection.execute(`CREATE TABLE IF NOT EXISTS likes (
      id VARCHAR(36) PRIMARY KEY,
      paper_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paper_id) REFERENCES papers (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE KEY unique_like (paper_id, user_id)
    )`);
    
    connection.release();
    console.log('✅ 数据库表初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.log('提示: 请确保MySQL服务器正在运行，并且数据库配置正确');
  }
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 纸团服务器启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 API文档: http://localhost:${PORT}/api/health`);
  
  // 异步初始化数据库
  initDatabase();
});

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 计算两点间距离（米）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// API路由

// 用户注册
app.post('/api/register', async (req, res) => {
  const { nickname, password, avatar } = req.body;
  
  // 添加调试日志
  console.log('注册请求数据:', { nickname, password: '***', avatar });

  if (!nickname || !password) {
    return res.status(400).json({ error: '昵称和密码不能为空' });
  }

  try {
    // 检查昵称是否已存在
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE nickname = ?', [nickname]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '昵称已存在' });
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    // 使用用户选择的头像，如果没有选择则使用默认头像
    const userAvatar = avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square';
    
    console.log('准备插入数据库的头像URL:', userAvatar);

    await pool.execute(
      'INSERT INTO users (id, nickname, password, avatar) VALUES (?, ?, ?, ?)',
      [userId, nickname, hashedPassword, userAvatar]
    );
    
    // 验证插入后的数据
    const [insertedUser] = await pool.execute('SELECT avatar FROM users WHERE id = ?', [userId]);
    console.log('数据库中实际保存的头像:', insertedUser[0]?.avatar);

    const token = jwt.sign({ userId, nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: userId,
        nickname,
        avatar: userAvatar,
        isLoggedIn: true
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ error: '昵称和密码不能为空' });
  }

  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE nickname = ?', [nickname]);
    
    if (users.length === 0) {
      return res.status(400).json({ error: '用户不存在' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '密码错误' });
    }

    const token = jwt.sign({ userId: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        isLoggedIn: true
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 上传媒体文件
app.post('/api/upload', authenticateToken, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件上传' });
  }

  // 返回相对路径，这样可以适配不同的域名
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// 丢纸团
app.post('/api/papers', authenticateToken, async (req, res) => {
  const { content, type, mediaUrl, latitude, longitude } = req.body;
  const { userId, nickname } = req.user;

  if (!content && !mediaUrl) {
    return res.status(400).json({ error: '内容不能为空' });
  }

  if (!latitude || !longitude) {
    return res.status(400).json({ error: '位置信息缺失' });
  }

  try {
    const paperId = uuidv4();

    await pool.execute(
      'INSERT INTO papers (id, content, type, media_url, author_id, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [paperId, content || '', type || 'text', mediaUrl || null, userId, latitude, longitude]
    );

    // 获取用户信息用于返回
    const [users] = await pool.execute('SELECT nickname, avatar FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const authorAvatar = user ? user.avatar : 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square';

    res.json({
      success: true,
      paper: {
        id: paperId,
        content: content || '',
        type,
        mediaUrl,
        authorId: userId,
        authorNickname: nickname,
        authorAvatar,
        latitude,
        longitude,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('创建纸团错误:', error);
    res.status(500).json({ error: '创建纸团失败' });
  }
});

// 搜索附近纸团
app.get('/api/papers/nearby', authenticateToken, async (req, res) => {
  const { latitude, longitude, radius = 10 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: '位置信息缺失' });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const searchRadius = parseFloat(radius);

  try {
    const [papers] = await pool.execute(
      `SELECT p.*, u.nickname as author_nickname, u.avatar as author_avatar,
              COUNT(DISTINCT l.id) as likes,
              COUNT(DISTINCT c.id) as comment_count
       FROM papers p 
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN likes l ON p.id = l.paper_id 
       LEFT JOIN comments c ON p.id = c.paper_id
       GROUP BY p.id 
       ORDER BY p.created_at DESC`
    );

    // 过滤距离范围内的纸团
    const nearbyPapers = papers.filter(paper => {
      const distance = calculateDistance(lat, lon, paper.latitude, paper.longitude);
      return distance <= searchRadius;
    }).map(paper => ({
      id: paper.id,
      content: paper.content,
      type: paper.type,
      mediaUrl: paper.media_url,
      authorId: paper.author_id,
      authorNickname: paper.author_nickname || '匿名用户',
      authorAvatar: paper.author_avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square',
      latitude: paper.latitude,
      longitude: paper.longitude,
      likes: paper.likes || 0,
      comments: Array(paper.comment_count || 0).fill(null).map((_, i) => ({ id: `comment_${i}` })),
      createdAt: paper.created_at,
      distance: calculateDistance(lat, lon, paper.latitude, paper.longitude)
    }));

    res.json({ success: true, papers: nearbyPapers });
  } catch (error) {
    console.error('搜索纸团错误:', error);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 获取纸团详情
app.get('/api/papers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [papers] = await pool.execute(
      `SELECT p.*, u.nickname as author_nickname, u.avatar as author_avatar, COUNT(l.id) as likes
       FROM papers p 
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN likes l ON p.id = l.paper_id 
       WHERE p.id = ? 
       GROUP BY p.id`,
      [id]
    );

    if (papers.length === 0) {
      return res.status(404).json({ error: '纸团不存在' });
    }

    const paper = papers[0];

    // 获取评论
    const [comments] = await pool.execute(
      `SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar 
       FROM comments c 
       LEFT JOIN users u ON c.author_id = u.id 
       WHERE c.paper_id = ? 
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      paper: {
        id: paper.id,
        content: paper.content,
        type: paper.type,
        mediaUrl: paper.media_url,
        authorId: paper.author_id,
        authorNickname: paper.author_nickname || '匿名用户',
        authorAvatar: paper.author_avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square',
        latitude: paper.latitude,
        longitude: paper.longitude,
        likes: paper.likes || 0,
        comments: comments.map(c => ({
          id: c.id,
          content: c.content,
          authorId: c.author_id,
          authorNickname: c.author_nickname || '匿名用户',
          authorAvatar: c.author_avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square',
          parentId: c.parent_id,
          createdAt: c.created_at
        })),
        createdAt: paper.created_at
      }
    });
  } catch (error) {
    console.error('获取纸团详情错误:', error);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 点赞纸团
app.post('/api/papers/:id/like', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    // 检查纸团是否存在
    const [papers] = await pool.execute(
      'SELECT * FROM papers WHERE id = ?',
      [id]
    );
    
    if (papers.length === 0) {
      return res.status(404).json({ error: '纸团不存在' });
    }
    
    const paper = papers[0];

    // 检查是否已经点赞
    const [existingLikes] = await pool.execute(
      'SELECT id FROM likes WHERE paper_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingLikes.length > 0) {
      // 取消点赞
      await pool.execute(
        'DELETE FROM likes WHERE paper_id = ? AND user_id = ?',
        [id, userId]
      );
      res.json({ success: true, liked: false });
    } else {
      // 添加点赞
      const likeId = uuidv4();
      await pool.execute(
        'INSERT INTO likes (id, paper_id, user_id) VALUES (?, ?, ?)',
        [likeId, id, userId]
      );
      
      // 创建点赞消息提醒（不给自己发消息）
      if (paper.author_id !== userId) {
        const messageId = uuidv4();
        await pool.execute(
          'INSERT INTO messages (id, user_id, type, paper_id, from_user_id, content) VALUES (?, ?, ?, ?, ?, ?)',
          [messageId, paper.author_id, 'like', id, userId, '点赞了你的纸团']
        );
      }
      
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({ error: '点赞操作失败' });
  }
});

// 添加评论
app.post('/api/papers/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content, parentId } = req.body;
  const { userId, nickname } = req.user;

  if (!content) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }

  try {
    // 检查纸团是否存在
    const [papers] = await pool.execute(
      'SELECT * FROM papers WHERE id = ?',
      [id]
    );
    
    if (papers.length === 0) {
      return res.status(404).json({ error: '纸团不存在' });
    }
    
    const paper = papers[0];
    
    // 如果是回复，检查父评论是否存在
    let parentComment = null;
    let actualParentId = parentId;
    if (parentId) {
      const [parentComments] = await pool.execute(
        'SELECT * FROM comments WHERE id = ? AND paper_id = ?',
        [parentId, id]
      );
      
      if (parentComments.length === 0) {
        return res.status(404).json({ error: '父评论不存在' });
      }
      
      parentComment = parentComments[0];
      
      // 如果父评论本身就是回复（有parent_id），则使用父评论的parent_id
      // 这样所有回复都只有两级：顶级评论和二级回复
      if (parentComment.parent_id) {
        actualParentId = parentComment.parent_id;
        // 更新parentComment为真正的顶级评论，用于消息通知
        const [topComments] = await pool.execute(
          'SELECT * FROM comments WHERE id = ? AND paper_id = ?',
          [parentComment.parent_id, id]
        );
        if (topComments.length > 0) {
          parentComment = topComments[0];
        }
      }
    }

    const commentId = uuidv4();
    await pool.execute(
      'INSERT INTO comments (id, paper_id, content, author_id, parent_id) VALUES (?, ?, ?, ?, ?)',
      [commentId, id, content, userId, actualParentId || null]
    );

    // 获取用户信息用于返回
    const [users] = await pool.execute('SELECT nickname, avatar FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const authorAvatar = user ? user.avatar : 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square';
    const authorNickname = user ? user.nickname : '匿名用户';

    // 创建消息提醒
    if (parentId && parentComment) {
      // 回复评论的消息提醒（不给自己发消息）
      if (parentComment.author_id !== userId) {
        const messageId = uuidv4();
        await pool.execute(
          'INSERT INTO messages (id, user_id, type, paper_id, comment_id, from_user_id, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [messageId, parentComment.author_id, 'reply', id, commentId, userId, content]
        );
      }
    } else if (paper.author_id !== userId) {
      // 评论纸团的消息提醒（不给自己发消息）
      const messageId = uuidv4();
      await pool.execute(
        'INSERT INTO messages (id, user_id, type, paper_id, comment_id, from_user_id, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [messageId, paper.author_id, 'comment', id, commentId, userId, content]
      );
    }

    res.json({
      success: true,
      comment: {
        id: commentId,
        content,
        authorId: userId,
        authorNickname,
        authorAvatar,
        parentId: parentId || null,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ error: '添加评论失败' });
  }
});

// 获取用户的纸团
app.get('/api/users/:id/papers', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [papers] = await pool.execute(
      `SELECT p.*, u.nickname as author_nickname, u.avatar as author_avatar, 
              COUNT(DISTINCT l.id) as likes,
              COUNT(DISTINCT c.id) as comment_count
       FROM papers p 
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN likes l ON p.id = l.paper_id 
       LEFT JOIN comments c ON p.id = c.paper_id
       WHERE p.author_id = ? 
       GROUP BY p.id 
       ORDER BY p.created_at DESC`,
      [id]
    );

    const userPapers = papers.map(paper => ({
      id: paper.id,
      content: paper.content,
      type: paper.type,
      mediaUrl: paper.media_url,
      authorId: paper.author_id,
      authorNickname: paper.author_nickname || '匿名用户',
      authorAvatar: paper.author_avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square',
      latitude: paper.latitude,
      longitude: paper.longitude,
      likes: paper.likes || 0,
      comments: Array(paper.comment_count || 0).fill(null).map((_, i) => ({ id: `comment_${i}` })),
      createdAt: paper.created_at
    }));

    res.json({ success: true, papers: userPapers });
  } catch (error) {
    console.error('获取用户纸团错误:', error);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 获取用户评论过的纸团
app.get('/api/users/:id/commented-papers', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [papers] = await pool.execute(
      `SELECT DISTINCT p.*, u.nickname as author_nickname, u.avatar as author_avatar, 
              COUNT(DISTINCT l.id) as likes,
              COUNT(DISTINCT c.id) as comment_count
       FROM papers p 
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN likes l ON p.id = l.paper_id 
       LEFT JOIN comments c ON p.id = c.paper_id
       INNER JOIN comments uc ON uc.paper_id = p.id
       WHERE uc.author_id = ? 
       GROUP BY p.id 
       ORDER BY p.created_at DESC`,
      [id]
    );

    const commentedPapers = papers.map(paper => ({
      id: paper.id,
      content: paper.content,
      type: paper.type,
      mediaUrl: paper.media_url,
      authorId: paper.author_id,
      authorNickname: paper.author_nickname || '匿名用户',
      authorAvatar: paper.author_avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square',
      latitude: paper.latitude,
      longitude: paper.longitude,
      likes: paper.likes || 0,
      comments: Array(paper.comment_count || 0).fill(null).map((_, i) => ({ id: `comment_${i}` })),
      createdAt: paper.created_at
    }));

    res.json({ success: true, papers: commentedPapers });
  } catch (error) {
    console.error('获取用户评论过的纸团错误:', error);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 检查昵称可用性
app.get('/api/users/check-nickname/:nickname', async (req, res) => {
  const { nickname } = req.params;

  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE nickname = ?', [nickname]);
    
    res.json({ 
      success: true, 
      available: users.length === 0 
    });
  } catch (error) {
    console.error('检查昵称错误:', error);
    res.status(500).json({ error: '检查昵称失败' });
  }
});

// 更新用户头像
app.put('/api/users/:id/avatar', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { avatar } = req.body;
  const { userId } = req.user;

  if (userId !== id) {
    return res.status(403).json({ error: '无权限修改其他用户信息' });
  }

  try {
    await pool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, id]
    );

    res.json({ success: true, avatar });
  } catch (error) {
    console.error('更新头像错误:', error);
    res.status(500).json({ error: '更新头像失败' });
  }
});

// 更新用户昵称
app.put('/api/users/:id/nickname', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nickname } = req.body;
  const { userId } = req.user;

  if (userId !== id) {
    return res.status(403).json({ error: '无权限修改其他用户信息' });
  }

  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: '昵称不能为空' });
  }

  try {
    // 检查昵称是否已被其他用户使用
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE nickname = ? AND id != ?', 
      [nickname.trim(), id]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '昵称已被使用' });
    }

    await pool.execute(
      'UPDATE users SET nickname = ? WHERE id = ?',
      [nickname.trim(), id]
    );

    res.json({ success: true, nickname: nickname.trim() });
  } catch (error) {
    console.error('更新昵称错误:', error);
    res.status(500).json({ error: '更新昵称失败' });
  }
});

// 获取用户消息
app.get('/api/users/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 验证用户权限
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: '无权访问' });
    }
    
    const [messages] = await pool.execute(
      `SELECT m.*, 
              fu.nickname as from_nickname, fu.avatar as from_avatar,
              p.id as paper_id, p.content as paper_content, p.type as paper_type,
              c.content as comment_content
       FROM messages m
       JOIN users fu ON m.from_user_id = fu.id
       JOIN papers p ON m.paper_id = p.id
       LEFT JOIN comments c ON m.comment_id = c.id
       WHERE m.user_id = ?
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [userId]
    );
    
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      type: msg.type,
      content: msg.content || '',
      isRead: !!msg.is_read,
      createdAt: msg.created_at,
      fromUser: {
        id: msg.from_user_id,
        nickname: msg.from_nickname,
        avatar: msg.from_avatar
      },
      relatedPaper: {
        id: msg.paper_id,
        content: msg.paper_content,
        type: msg.paper_type
      },
      ...(msg.comment_content && {
        relatedComment: {
          id: msg.comment_id,
          content: msg.comment_content
        }
      })
    }));
    
    res.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error('获取消息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 标记消息为已读
app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;
    
    // 验证消息所有权
    const [messages] = await pool.execute(
      'SELECT user_id FROM messages WHERE id = ?',
      [messageId]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({ success: false, message: '消息不存在' });
    }
    
    if (messages[0].user_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }
    
    await pool.execute(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [messageId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取未读消息数量
app.get('/api/users/:id/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 验证用户权限
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: '无权访问' });
    }
    
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    res.json({ success: true, count: result[0].count });
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '纸团服务器运行正常' });
});

// 提供静态文件服务（前端打包文件）
app.use(express.static(path.join(__dirname, 'public')));

// 处理前端路由，返回index.html（必须放在最后）
app.use((req, res, next) => {
  // 如果是API请求或静态资源，跳过
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  // 对于其他所有请求，返回前端应用
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  try {
    await pool.end();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接时出错:', error.message);
  }
  process.exit(0);
});