import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  const { login, register, defaultAvatars } = useUserStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本验证
    if (!nickname.trim() || !password.trim()) {
      toast.error('请填写所有字段');
      return;
    }
    
    if (password.length < 6) {
      toast.error('密码至少6位');
      return;
    }
    
    if (nickname.length < 2 || nickname.length > 20) {
      toast.error('昵称长度应在2-20个字符之间');
      return;
    }
    
    // 注册时头像必须选择
    if (!isLogin && !selectedAvatar) {
      toast.error('请选择一个头像');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let success = false;
      
      if (isLogin) {
        console.log('尝试登录:', nickname);
        success = await login(nickname, password);
        console.log('登录结果:', success);
        if (success) {
          toast.success('登录成功！');
          console.log('登录成功，跳转到首页');
          navigate('/');
        } else {
          toast.error('用户名或密码错误');
          console.log('登录失败');
        }
      } else {
        console.log('尝试注册:', nickname);
        success = await register(nickname, password, selectedAvatar);
        console.log('注册结果:', success);
        if (success) {
          toast.success('注册成功！');
          console.log('注册成功，跳转到首页');
          navigate('/');
        } else {
          toast.error('昵称已存在，请换一个');
          console.log('注册失败');
        }
      }
    } catch (error) {
      console.error('认证错误:', error);
      toast.error('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      {/* 背景粒子效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -100, window.innerHeight + 100],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo区域 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="text-2xl font-bold text-white">纸</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">纸团</h1>
          <p className="text-gray-300 text-sm">基于地理位置的匿名社交</p>
        </motion.div>
        
        {/* 表单卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
        >
          {/* 切换按钮 */}
          <div className="flex mb-6 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                isLogin
                  ? 'bg-[#ff6b35] text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                !isLogin
                  ? 'bg-[#ff6b35] text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              注册
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 昵称输入 */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all duration-300"
                maxLength={20}
              />
            </div>
            
            {/* 密码输入 */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* 头像选择 - 只在注册时显示 */}
            {!isLogin && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  选择头像 <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center cursor-pointer hover:border-[#ff6b35] transition-all duration-300"
                    onClick={() => setShowAvatarSelector(true)}
                  >
                    {selectedAvatar ? (
                      <img 
                        src={selectedAvatar} 
                        alt="选择的头像" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarSelector(true)}
                    className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-gray-300 hover:text-white hover:border-[#ff6b35] transition-all duration-300"
                  >
                    {selectedAvatar ? '更换头像' : '选择头像'}
                  </button>
                </div>
              </div>
            )}
            
            {/* 提交按钮 */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white font-medium rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {isLogin ? '登录中...' : '注册中...'}
                </div>
              ) : (
                isLogin ? '登录' : '注册'
              )}
            </motion.button>
          </form>
          
          {/* 提示信息 */}
          <div className="mt-4 text-center text-sm text-gray-400">
            {isLogin ? (
              <p>
                还没有账号？
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-[#ff6b35] hover:text-[#f7931e] ml-1 transition-colors"
                >
                  立即注册
                </button>
              </p>
            ) : (
              <p>
                已有账号？
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-[#ff6b35] hover:text-[#f7931e] ml-1 transition-colors"
                >
                  立即登录
                </button>
              </p>
            )}
          </div>
        </motion.div>
        
        {/* 底部说明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-gray-400 text-xs"
        >
          <p>注册即表示同意用户协议和隐私政策</p>
          <p className="mt-1">昵称全局唯一，请谨慎选择</p>
        </motion.div>
      </motion.div>
      
      {/* 头像选择弹窗 */}
      <AnimatePresence>
        {showAvatarSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAvatarSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">选择头像</h3>
                <button
                  onClick={() => setShowAvatarSelector(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                {defaultAvatars.map((avatar, index) => (
                  <motion.img
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    src={avatar}
                    alt={`头像 ${index + 1}`}
                    className={`w-16 h-16 rounded-full cursor-pointer border-2 transition-all duration-300 ${
                      selectedAvatar === avatar
                        ? 'border-[#ff6b35] shadow-lg shadow-orange-500/30'
                        : 'border-white/20 hover:border-[#ff6b35]/50'
                    }`}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      setShowAvatarSelector(false);
                      toast.success('头像选择成功！');
                    }}
                    loading="lazy"
                  />
                ))}
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => setShowAvatarSelector(false)}
                  className="px-6 py-2 bg-white/5 border border-white/20 rounded-lg text-gray-300 hover:text-white hover:border-[#ff6b35] transition-all duration-300"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;