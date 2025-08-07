import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { usePaperStore, PaperBall } from '@/store/paperStore';
import { ArrowLeft, Search, MapPin, Clock, Heart, MessageCircle, Eye, Radar } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/utils/timeUtils';

const SearchPaper: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { currentLocation, getCurrentLocation, searchNearbyPapers } = usePaperStore();
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState(1000);
  const [foundPapers, setFoundPapers] = useState<PaperBall[]>([]);
  
  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/auth');
      return;
    }
    
    // 获取当前位置
    getCurrentLocation();
  }, [user, navigate]);
  
  // 计算距离
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  };
  
  const handleSearch = async () => {
    if (!currentLocation) {
      toast.error('无法获取当前位置');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const papers = await searchNearbyPapers(searchRadius);
      
      // 添加距离信息
      const papersWithDistance = papers.map(paper => ({
        ...paper,
        distance: calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          paper.location?.latitude || 0,
          paper.location?.longitude || 0
        )
      })).sort((a, b) => a.distance - b.distance);
      
      setFoundPapers(papersWithDistance);
      setIsSearching(false);
      
      if (papersWithDistance.length > 0) {
        toast.success(`发现了 ${papersWithDistance.length} 个纸团！`);
      } else {
        toast.info('附近没有发现纸团，试试扩大搜索范围');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error('搜索失败，请重试');
      setIsSearching(false);
    }
  };
  
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 100)}cm`;
    } else if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };
  
  const getContentPreview = (paper: PaperBall): string => {
    if (paper.type === 'text') {
      return paper.content.length > 50 ? paper.content.substring(0, 50) + '...' : paper.content;
    }
    return `[${paper.type === 'image' ? '图片' : paper.type === 'audio' ? '语音' : '视频'}] ${paper.content || '无描述'}`;
  };
  
  if (!user?.isLoggedIn) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      {/* 搜索动画覆盖层 */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="text-center">
              {/* 雷达扫描动画 */}
              <div className="relative w-40 h-40 mx-auto mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border-4 border-transparent border-t-[#ff6b35] rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-4 border-2 border-transparent border-t-blue-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-8 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] rounded-full flex items-center justify-center"
                >
                  <Radar className="w-8 h-8 text-white" />
                </motion.div>
                
                {/* 波纹效果 */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.7,
                    }}
                    className="absolute inset-0 border-2 border-[#ff6b35] rounded-full"
                  />
                ))}
              </div>
              
              <motion.h3
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl font-bold mb-2"
              >
                搜索中...
              </motion.h3>
              <p className="text-gray-300">正在扫描 {searchRadius}m 范围内的纸团</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>返回</span>
          </button>
          
          <h1 className="text-2xl font-bold">寻找纸团</h1>
          
          <div className="w-16" /> {/* 占位符 */}
        </motion.div>
        
        {/* 位置信息 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20"
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
        
        {/* 搜索控制 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold mb-4">搜索设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                搜索半径: {searchRadius}m
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5m</span>
                <span>100m</span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={isSearching || !currentLocation}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                <Search className="w-5 h-5" />
                <span>{isSearching ? '搜索中...' : '开始搜索'}</span>
              </div>
            </motion.button>
          </div>
        </motion.div>
        
        {/* 搜索结果 */}
        {foundPapers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Eye className="w-5 h-5 text-[#ff6b35] mr-2" />
              发现的纸团 ({foundPapers.length})
            </h3>
            
            {foundPapers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                onClick={() => navigate(`/paper/${paper.id}`)}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={paper.author?.avatar || '/default-avatar.png'}
                    alt="头像"
                    className="w-12 h-12 rounded-full border-2 border-[#ff6b35]"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{paper.author?.nickname || '匿名用户'}</h4>
                      <div className="flex items-center space-x-1 text-xs text-[#ff6b35] bg-[#ff6b35]/20 px-2 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance((paper as any).distance)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {getContentPreview(paper)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(paper.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{paper.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{paper.comments.length}</span>
                        </div>
                      </div>
                      
                      <div className="px-2 py-1 bg-white/10 rounded-full text-xs">
                        {paper.type === 'text' ? '文字' : 
                         paper.type === 'image' ? '图片' :
                         paper.type === 'audio' ? '语音' : '视频'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* 空状态 */}
        {!isSearching && foundPapers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-300">还没有搜索</h3>
            <p className="text-gray-400 mb-6">点击上方按钮开始搜索附近的纸团</p>
            
            {/* 搜索提示 */}
            <div className="bg-white/5 rounded-xl p-4 max-w-sm mx-auto">
              <h4 className="font-medium mb-2 text-[#ff6b35]">搜索提示</h4>
              <ul className="text-sm text-gray-400 space-y-1 text-left">
                <li>• 调整搜索半径可以发现更多纸团</li>
                <li>• 纸团按距离远近排序显示</li>
                <li>• 点击纸团可以查看详细内容</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff6b35;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff6b35;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default SearchPaper;