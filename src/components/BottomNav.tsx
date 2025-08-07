import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  requireAuth?: boolean;
}

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserStore();
  
  const navItems: NavItem[] = [
    {
      path: '/',
      icon: <Home className="w-6 h-6" />,
      label: '首页',
    },
    {
      path: '/profile',
      icon: <User className="w-6 h-6" />,
      label: '我的',
      requireAuth: true,
    },
  ];
  
  const handleNavClick = (item: NavItem) => {
    if (item.requireAuth && !user?.isLoggedIn) {
      navigate('/auth');
      return;
    }
    navigate(item.path);
  };
  
  // 在登录页面不显示底部导航
  if (location.pathname === '/auth') {
    return null;
  }
  
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="bg-white/10 backdrop-blur-lg border-t border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {navItems.map((item, _index) => {
              const isActive = location.pathname === item.path;
              
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(item)}
                  className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'text-[#ff6b35] bg-[#ff6b35]/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      rotate: isActive ? [0, -10, 10, 0] : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.icon}
                  </motion.div>
                  <span className="text-xs font-medium">{item.label}</span>
                  
                  {/* 活跃指示器 */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-1 w-1 h-1 bg-[#ff6b35] rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BottomNav;