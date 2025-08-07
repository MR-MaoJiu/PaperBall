// 认证测试工具
import { getToken } from '@/services/api';

export const testAuth = () => {
  const token = getToken();
  const userStorage = localStorage.getItem('user-storage');
  
  console.log('=== 认证状态检查 ===');
  console.log('Token:', token);
  console.log('User Storage:', userStorage);
  
  if (userStorage) {
    try {
      const parsed = JSON.parse(userStorage);
      console.log('Parsed User Storage:', parsed);
      console.log('User State:', parsed.state?.user);
    } catch (e) {
      console.error('解析用户存储失败:', e);
    }
  }
  
  return {
    hasToken: !!token,
    hasUserStorage: !!userStorage,
    token,
    userStorage
  };
};

// 测试API调用
export const testAPICall = async () => {
  const token = getToken();
  
  if (!token) {
    console.error('没有token，无法测试API调用');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:3001/api/papers/nearby?latitude=39.9042&longitude=116.4074&radius=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API响应状态:', response.status);
    const data = await response.json();
    console.log('API响应数据:', data);
    
    return { status: response.status, data };
  } catch (error) {
    console.error('API调用失败:', error);
    return { error };
  }
};

// 在浏览器控制台中暴露测试函数
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuth;
  (window as any).testAPICall = testAPICall;
}