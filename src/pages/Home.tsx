import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { usePaperStore } from '@/store/paperStore';
import { Send, Search, User, MapPin, Bell } from 'lucide-react';
import { userAPI } from '@/services/api';
import { testAuth } from '@/utils/authTest';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { currentLocation, getCurrentLocation } = usePaperStore();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 如果用户未登录，显示加载状态
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">加载中...</p>
        </div>
      </div>
    );
  }
  
  useEffect(() => {
    // 调试用户状态
    console.log('用户状态:', user);
    console.log('localStorage token:', localStorage.getItem('token'));
    
    // 运行认证测试
    const authStatus = testAuth();
    console.log('认证状态:', authStatus);
    
    // 只获取当前位置，不自动搜索纸团
    getCurrentLocation();
    
    // 获取未读消息数量
    if (user?.isLoggedIn) {
      fetchUnreadCount();
      // 每30秒检查一次未读消息
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [getCurrentLocation, user]);
  
  const fetchUnreadCount = async () => {
    try {
      if (user?.isLoggedIn) {
        const response = await userAPI.getUnreadCount(user.id.toString());
        if (response.success) {
          setUnreadCount(response.count);
        }
      }
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
    }
  };
  
  // ProtectedRoute已经处理了认证检查，这里不需要再检查
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      {/* 背景粒子动画 */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 顶部用户信息 */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-3">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={user.avatar}
              alt="头像"
              className="w-12 h-12 rounded-full border-2 border-[#ff6b35] shadow-lg"
            />
            <div>
              <h2 className="text-lg font-semibold">{user.nickname}</h2>
              <div className="flex items-center text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                在线
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/messages')}
              className="relative p-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="p-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <User className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>
        
        {/* 主标题 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] bg-clip-text text-transparent">
            纸团
          </h1>
          <p className="text-gray-300 text-lg">在这里丢下你的故事，发现身边的秘密</p>
        </motion.div>
        
        {/* 位置信息卡片 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-8 border border-white/20"
        >
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-[#ff6b35]" />
            <div>
              <p className="text-sm text-gray-300">当前位置</p>
              <p className="font-medium">
                {currentLocation
                  ? `${Number(currentLocation.latitude || 0).toFixed(4)}, ${Number(currentLocation.longitude || 0).toFixed(4)}`
                  : '获取位置中...'}
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* 主要功能按钮 */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* 丢纸团按钮 */}
          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/throw')}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            <div className="relative bg-gradient-to-r from-[#ff6b35] to-[#f7931e] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">丢纸团</h3>
                    <p className="text-white/80">分享你的故事到这个位置</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                />
              </div>
            </div>
          </motion.button>
          
          {/* 寻找纸团按钮 */}
          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/search')}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">寻找纸团</h3>
                    <p className="text-white/80">发现附近的秘密和故事</p>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-8 h-8 border-2 border-white/50 rounded-full"
                />
              </div>
            </div>
          </motion.button>
        </div>
        
        {/* 使用提示 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center"
        >
          <h3 className="text-lg font-semibold mb-2 text-[#ff6b35]">开始你的纸团之旅</h3>
          <p className="text-gray-300 text-sm mb-4">
            点击"丢纸团"分享你的故事，或点击"寻找纸团"发现附近的秘密
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-[#ff6b35] rounded-full"></div>
              <span>匿名分享</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>位置限定</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>实时互动</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;