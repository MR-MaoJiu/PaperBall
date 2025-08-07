import { mockApi } from './mockApi';

// 配置选项：是否使用模拟 API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'; // 统一使用相对路径，因为前端已打包并由后端提供服务

// 获取存储的token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// 设置token
const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// 移除token
const removeToken = (): void => {
  localStorage.removeItem('token');
};

// 通用请求函数
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// 用户相关API
export const userAPI = {
  // 注册
  register: async (nickname: string, password: string, avatar?: string) => {
    if (USE_MOCK_API) {
      return await mockApi.register(nickname, password);
    }
    
    const data = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ nickname, password, avatar }),
    });
    
    if (data.success && data.token) {
      setToken(data.token);
    }
    
    return data;
  },

  // 登录
  login: async (nickname: string, password: string) => {
    if (USE_MOCK_API) {
      return await mockApi.login(nickname, password);
    }
    
    const data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ nickname, password }),
    });
    
    if (data.success && data.token) {
      setToken(data.token);
    }
    
    return data;
  },

  // 登出
  logout: () => {
    removeToken();
  },

  // 检查昵称可用性
  checkNickname: async (nickname: string) => {
    if (USE_MOCK_API) {
      return { success: true, available: true };
    }
    
    return await apiRequest(`/users/check-nickname/${encodeURIComponent(nickname)}`);
  },

  // 更新头像
  updateAvatar: async (userId: string, avatar: string) => {
    if (USE_MOCK_API) {
      return await mockApi.updateAvatar(userId, avatar);
    }
    
    return await apiRequest(`/users/${userId}/avatar`, {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    });
  },

  // 更新昵称
  updateNickname: async (userId: string, nickname: string) => {
    if (USE_MOCK_API) {
      return { success: true, nickname };
    }
    
    return await apiRequest(`/users/${userId}/nickname`, {
      method: 'PUT',
      body: JSON.stringify({ nickname }),
    });
  },

  // 获取用户消息
  getMessages: async (userId: string) => {
    if (USE_MOCK_API) {
      return { success: true, messages: [] };
    }
    
    return await apiRequest(`/users/${userId}/messages`);
  },

  // 获取未读消息数量
  getUnreadCount: async (userId: string) => {
    if (USE_MOCK_API) {
      return { success: true, count: 0 };
    }
    
    return await apiRequest(`/users/${userId}/unread-count`);
  },

  // 标记消息为已读
  markMessageRead: async (messageId: string) => {
    if (USE_MOCK_API) {
      return { success: true };
    }
    
    return await apiRequest(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  },

  // 创建消息通知
  createMessage: async (data: {
    userId: string;
    type: 'comment' | 'reply' | 'like';
    message: string;
    fromUserId: string;
    paperId?: string;
    commentId?: string;
  }) => {
    if (USE_MOCK_API) {
      return { success: true };
    }
    
    return await apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 获取用户纸团
  getUserPapers: async (userId: string) => {
    if (USE_MOCK_API) {
      return await mockApi.getUserPapers(userId);
    }
    
    return await apiRequest(`/users/${userId}/papers`);
  },

  // 获取用户评论过的纸团
  getUserCommentedPapers: async (userId: string) => {
    if (USE_MOCK_API) {
      return { success: true, papers: [] };
    }
    
    return await apiRequest(`/users/${userId}/commented-papers`);
  },
};

// 纸团相关API
export const paperAPI = {
  // 丢纸团
  throwPaper: async (data: { content: string; type: 'text' | 'image' | 'audio' | 'video'; mediaUrl?: string; location: { latitude: number; longitude: number } }) => {
    if (USE_MOCK_API) {
      return await mockApi.throwPaper(data);
    }
    
    return await apiRequest('/papers', {
      method: 'POST',
      body: JSON.stringify({
        content: data.content,
        type: data.type,
        mediaUrl: data.mediaUrl,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      }),
    });
  },

  // 搜索附近纸团
  findNearbyPapers: async (latitude: number, longitude: number, radius: number = 10) => {
    if (USE_MOCK_API) {
      return await mockApi.findNearbyPapers(latitude, longitude, radius);
    }
    
    return await apiRequest(`/papers/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
  },

  // 搜索附近纸团（别名）
  searchNearby: async (data: { latitude: number; longitude: number; radius: number }) => {
    if (USE_MOCK_API) {
      return await mockApi.findNearbyPapers(data.latitude, data.longitude, data.radius);
    }
    
    return await apiRequest(`/papers/nearby?latitude=${data.latitude}&longitude=${data.longitude}&radius=${data.radius}`);
  },

  // 获取纸团详情
  getPaperDetail: async (paperId: string) => {
    if (USE_MOCK_API) {
      return await mockApi.getPaperDetail(paperId);
    }
    
    return await apiRequest(`/papers/${paperId}`);
  },

  // 点赞纸团
  likePaper: async (paperId: string) => {
    if (USE_MOCK_API) {
      return await mockApi.likePaper(parseInt(paperId));
    }
    
    return await apiRequest(`/papers/${paperId}/like`, {
      method: 'POST',
    });
  },

  // 添加评论
  addComment: async (paperId: string, content: string, parentId?: string) => {
    if (USE_MOCK_API) {
      return await mockApi.addComment(paperId, content);
    }
    
    return await apiRequest(`/papers/${paperId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  },

  // 获取用户纸团
  getUserPapers: async (userId: string) => {
    if (USE_MOCK_API) {
      return await mockApi.getUserPapers(userId);
    }
    
    return await apiRequest(`/users/${userId}/papers`);
  },
};

// 媒体文件上传API
export const mediaAPI = {
  // 上传文件
  uploadFile: async (file: File): Promise<string> => {
    if (USE_MOCK_API) {
      return await mockApi.uploadFile(file);
    }
    
    const formData = new FormData();
    formData.append('media', file);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '文件上传失败');
    }
    
    return `http://localhost:3001${data.url}`;
  },
};

// 健康检查
export const healthAPI = {
  check: async () => {
    if (USE_MOCK_API) {
      return { success: true, message: 'Mock API is healthy' };
    }
    
    return await apiRequest('/health');
  },
};

export { getToken, setToken, removeToken };