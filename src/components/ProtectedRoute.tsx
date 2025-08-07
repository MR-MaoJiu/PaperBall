import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { getToken } from '@/services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const token = getToken();

  useEffect(() => {
    // 检查用户是否已登录且有有效token
    if (!user?.isLoggedIn || !token) {
      console.log('用户未登录或token缺失，跳转到登录页面');
      console.log('用户状态:', user);
      console.log('Token:', token);
      navigate('/auth');
      return;
    }
  }, [user, token, navigate]);

  // 如果用户未登录或没有token，不渲染子组件
  if (!user?.isLoggedIn || !token) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;