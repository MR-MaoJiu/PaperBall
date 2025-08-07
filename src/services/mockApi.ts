// 模拟后端 API - 用于演示和开发

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

interface Paper {
  id: number;
  content: string;
  imageUrl?: string;
  authorId: number;
  author: User;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  author: User;
  paperId: number;
  createdAt: string;
}

// 模拟数据
const mockUsers: User[] = [
  {
    id: 1,
    username: 'demo_user',
    email: 'demo@example.com',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20cartoon%20avatar%20profile%20picture&image_size=square',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    username: 'paper_lover',
    email: 'lover@example.com',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20anime%20style%20avatar&image_size=square',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

const mockPapers: Paper[] = [
  {
    id: 1,
    content: '今天天气真好，适合出去走走！🌞',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20sunny%20day%20park%20scenery&image_size=landscape_16_9',
    authorId: 1,
    author: mockUsers[0],
    location: {
      latitude: 39.9042,
      longitude: 116.4074,
      address: '北京市朝阳区'
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likesCount: 12,
    commentsCount: 3,
    isLiked: false
  },
  {
    id: 2,
    content: '刚刚在咖啡店发现了一本很有趣的书📚',
    authorId: 2,
    author: mockUsers[1],
    location: {
      latitude: 31.2304,
      longitude: 121.4737,
      address: '上海市黄浦区'
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likesCount: 8,
    commentsCount: 1,
    isLiked: true
  },
  {
    id: 3,
    content: '周末计划去爬山，有人一起吗？🏔️',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20hiking%20trail%20beautiful%20landscape&image_size=landscape_4_3',
    authorId: 1,
    author: mockUsers[0],
    location: {
      latitude: 22.3193,
      longitude: 114.1694,
      address: '香港特别行政区'
    },
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    likesCount: 15,
    commentsCount: 5,
    isLiked: false
  }
];

const mockComments: Comment[] = [
  {
    id: 1,
    content: '天气确实不错！',
    authorId: 2,
    author: mockUsers[1],
    paperId: 1,
    createdAt: new Date(Date.now() - 3000000).toISOString()
  },
  {
    id: 2,
    content: '我也想去！',
    authorId: 2,
    author: mockUsers[1],
    paperId: 3,
    createdAt: new Date(Date.now() - 9000000).toISOString()
  }
];

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟 API 响应
export const mockApi = {
  // 用户相关
  async login(email: string, password: string) {
    await delay(1000);
    if (email === 'demo@example.com' && password === 'demo123') {
      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('token', token);
      return {
        success: true,
        data: {
          user: mockUsers[0],
          token
        }
      };
    }
    throw new Error('用户名或密码错误');
  },

  async register(usernameOrEmail: string, emailOrPassword: string, password?: string) {
    await delay(1000);
    let username, email;
    
    if (password) {
      // 三参数版本: register(username, email, password)
      username = usernameOrEmail;
      email = emailOrPassword;
    } else {
      // 两参数版本: register(nickname, password)
      username = usernameOrEmail;
      email = `${usernameOrEmail}@example.com`;
      password = emailOrPassword;
    }
    
    const newUser: User = {
      id: Date.now(),
      username,
      email,
      createdAt: new Date().toISOString()
    };
    const token = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('token', token);
    return {
      success: true,
      data: {
        user: newUser,
        token
      }
    };
  },

  async getCurrentUser() {
    await delay(500);
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }
    return {
      success: true,
      data: mockUsers[0]
    };
  },

  // 纸团相关
  async getPapers(page = 1, limit = 10) {
    await delay(800);
    return {
      success: true,
      data: {
        papers: mockPapers,
        total: mockPapers.length,
        page,
        limit
      }
    };
  },

  async getPaper(id: number) {
    await delay(500);
    const paper = mockPapers.find(p => p.id === id);
    if (!paper) {
      throw new Error('纸团不存在');
    }
    return {
      success: true,
      data: paper
    };
  },

  async createPaper(content: string, imageFile?: File, location?: { latitude: number; longitude: number }) {
    await delay(1200);
    const newPaper: Paper = {
      id: Date.now(),
      content,
      imageUrl: imageFile ? 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20uploaded%20image&image_size=landscape_16_9' : undefined,
      authorId: 1,
      author: mockUsers[0],
      location,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false
    };
    mockPapers.unshift(newPaper);
    return {
      success: true,
      data: newPaper
    };
  },

  async searchPapers(query: string, _location?: { latitude: number; longitude: number; radius: number }) {
    await delay(600);
    let results = mockPapers;
    
    if (query) {
      results = results.filter(paper => 
        paper.content.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return {
      success: true,
      data: {
        papers: results,
        total: results.length
      }
    };
  },

  async likePaper(id: number) {
    await delay(300);
    const paper = mockPapers.find(p => p.id === id);
    if (paper) {
      paper.isLiked = !paper.isLiked;
      paper.likesCount += paper.isLiked ? 1 : -1;
    }
    return {
      success: true,
      data: { isLiked: paper?.isLiked, likesCount: paper?.likesCount }
    };
  },

  // 评论相关
  async getComments(paperId: number) {
    await delay(400);
    const comments = mockComments.filter(c => c.paperId === paperId);
    return {
      success: true,
      data: comments
    };
  },

  async createComment(paperId: number, content: string) {
    await delay(600);
    const newComment: Comment = {
      id: Date.now(),
      content,
      authorId: 1,
      author: mockUsers[0],
      paperId,
      createdAt: new Date().toISOString()
    };
    mockComments.push(newComment);
    
    // 更新纸团的评论数
    const paper = mockPapers.find(p => p.id === paperId);
    if (paper) {
      paper.commentsCount++;
    }
    
    return {
      success: true,
      data: newComment
    };
  },

  // 健康检查
  async healthCheck() {
    await delay(200);
    return {
      success: true,
      data: {
        status: 'ok',
        message: '模拟 API 运行正常',
        timestamp: new Date().toISOString()
      }
    };
  },

  // 其他缺失的方法
  async updateAvatar(_userId: string, avatar: string) {
    await delay(500);
    return { success: true, data: { avatar } };
  },

  async getUserPapers(userId: string) {
    await delay(600);
    const userPapers = mockPapers.filter(p => p.authorId.toString() === userId);
    return { success: true, data: userPapers };
  },

  async throwPaper(data: any) {
    return this.createPaper(data.content, undefined, data.location);
  },

  async findNearbyPapers(_latitude: number, _longitude: number, _radius: number) {
    await delay(800);
    return {
      success: true,
      data: mockPapers
    };
  },

  async getPaperDetail(paperId: string) {
    return this.getPaper(parseInt(paperId));
  },

  async addComment(paperId: string, content: string) {
    return this.createComment(parseInt(paperId), content);
  },

  async uploadFile(_file: File) {
    await delay(1000);
    return 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=uploaded%20file&image_size=square';
  }
};

// 导出类型
export type { User, Paper, Comment };