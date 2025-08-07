import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { usePaperStore, Paper } from '@/store/paperStore';
import { ArrowLeft, Edit3, Camera, Heart, MessageCircle, MapPin, Clock, LogOut, User, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/utils/timeUtils';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateAvatar, updateNickname, checkNicknameAvailability, defaultAvatars } = useUserStore();
  const { getUserPapers, getUserCommentedPapers } = usePaperStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [myPapers, setMyPapers] = useState<Paper[]>([]);
  const [commentedPapers, setCommentedPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState<'papers' | 'liked'>('papers');

  
  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/auth');
      return;
    }
    
    setNewNickname(user.nickname);
    
    // 获取我的纸团
    const fetchMyPapers = async () => {
      try {
        const userPapers = await getUserPapers(user.id);
        setMyPapers(userPapers);
      } catch (error) {
        console.error('获取用户纸团失败:', error);
        toast.error('获取纸团数据失败');
      }
    };
    
    // 获取我评论过的纸团
    const fetchCommentedPapers = async () => {
      try {
        const papers = await getUserCommentedPapers(user.id.toString());
        setCommentedPapers(papers);
      } catch (error) {
        console.error('获取评论过的纸团失败:', error);
        toast.error('获取评论数据失败');
      }
    };
    
    fetchMyPapers();
    fetchCommentedPapers();
  }, [user, getUserPapers, navigate]);
  
  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
    navigate('/auth');
  };
  
  const handleUpdateNickname = async () => {
    if (!newNickname.trim() || newNickname.trim() === user?.nickname) {
      setIsEditing(false);
      return;
    }
    
    // 检查昵称是否已被使用
    const isAvailable = await checkNicknameAvailability(newNickname.trim());
    if (!isAvailable) {
      toast.error('该昵称已被使用，请选择其他昵称');
      return;
    }
    
    const success = await updateNickname(newNickname.trim());
    if (success) {
      setIsEditing(false);
    }
  };
  
  const handleUpdateAvatar = (avatarUrl: string) => {
    updateAvatar(avatarUrl);
    setShowAvatarSelector(false);
    toast.success('头像更新成功');
  };
  

  
  const getTotalLikes = (): number => {
    return myPapers.reduce((total, paper) => total + paper.likes, 0);
  };
  
  const getTotalComments = (): number => {
    return myPapers.reduce((total, paper) => total + paper.comments.length, 0);
  };
  
  if (!user?.isLoggedIn) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
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
          
          <h1 className="text-xl font-bold">个人中心</h1>
          
          <button
            onClick={handleLogout}
            className="p-2 bg-red-500/20 text-red-400 rounded-full backdrop-blur-sm border border-red-500/20 hover:bg-red-500/30 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </motion.div>
        
        {/* 用户信息卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20"
        >
          <div className="flex items-center space-x-6">
            {/* 头像 */}
            <div className="relative">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={user.avatar}
                alt="头像"
                className="w-24 h-24 rounded-full border-4 border-[#ff6b35] shadow-lg cursor-pointer"
                onClick={() => setShowAvatarSelector(true)}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAvatarSelector(true)}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#ff6b35] rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
              </motion.button>
            </div>
            
            {/* 用户信息 */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                      maxLength={20}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateNickname();
                        }
                        if (e.key === 'Escape') {
                          setIsEditing(false);
                          setNewNickname(user.nickname);
                        }
                      }}
                    />
                    <button
                      onClick={handleUpdateNickname}
                      className="px-3 py-1 bg-[#ff6b35] text-white rounded-lg text-sm hover:bg-[#f7931e] transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setNewNickname(user.nickname);
                      }}
                      className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-lg text-sm hover:bg-gray-500/30 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-white">{user.nickname}</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-400 hover:text-[#ff6b35] transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1 text-sm text-gray-400 mb-4">
                <User className="w-4 h-4" />
                <span>用户ID: {user.id}</span>
              </div>
              
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#ff6b35]">{myPapers.length}</div>
                  <div className="text-sm text-gray-400">纸团数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{getTotalLikes()}</div>
                  <div className="text-sm text-gray-400">获赞数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{getTotalComments()}</div>
                  <div className="text-sm text-gray-400">评论数</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* 标签页 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex space-x-1 mb-6 bg-white/5 rounded-xl p-1"
        >
          <button
            onClick={() => setActiveTab('papers')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'papers'
                ? 'bg-[#ff6b35] text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>我的纸团</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'liked'
                ? 'bg-[#ff6b35] text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>评论过的</span>
            </div>
          </button>
        </motion.div>
        
        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {activeTab === 'papers' && (
            <motion.div
              key="papers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {myPapers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">还没有发布纸团</p>
                  <p className="text-sm">去丢一个纸团，分享你的想法吧！</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/throw')}
                    className="mt-4 px-6 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#f7931e] transition-colors"
                  >
                    丢纸团
                  </motion.button>
                </div>
              ) : (
                myPapers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/paper/${paper.id}`)}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            paper.type === 'text' ? 'bg-blue-500/20 text-blue-400' :
                            paper.type === 'image' ? 'bg-green-500/20 text-green-400' :
                            paper.type === 'audio' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {paper.type === 'text' ? '文字' : 
                             paper.type === 'image' ? '图片' :
                             paper.type === 'audio' ? '语音' : '视频'}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(paper.timestamp)}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-3 line-clamp-2">
                          {paper.content || '多媒体内容'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{paper.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{paper.comments.length}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{Number(paper.location.latitude || 0).toFixed(4)}, {Number(paper.location.longitude || 0).toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {paper.type === 'image' && paper.mediaUrl && (
                        <img
                          src={paper.mediaUrl}
                          alt="纸团图片"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
          
          {activeTab === 'liked' && (
            <motion.div
              key="liked"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {commentedPapers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">还没有评论过纸团</p>
                  <p className="text-sm">去发现有趣的纸团，留下你的评论吧！</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="mt-4 px-6 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#f7931e] transition-colors"
                  >
                    去发现
                  </motion.button>
                </div>
              ) : (
                commentedPapers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/paper/${paper.id}`)}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            paper.type === 'text' ? 'bg-blue-500/20 text-blue-400' :
                            paper.type === 'image' ? 'bg-green-500/20 text-green-400' :
                            paper.type === 'audio' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {paper.type === 'text' ? '文字' : 
                             paper.type === 'image' ? '图片' :
                             paper.type === 'audio' ? '语音' : '视频'}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(paper.timestamp)}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-3 line-clamp-2">
                          {paper.content || '多媒体内容'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{paper.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{paper.comments.length}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{Number(paper.location.latitude || 0).toFixed(4)}, {Number(paper.location.longitude || 0).toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {paper.type === 'image' && paper.mediaUrl && (
                        <img
                          src={paper.mediaUrl}
                          alt="纸团图片"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 头像选择器 */}
      <AnimatePresence>
        {showAvatarSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAvatarSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-center mb-6">选择头像</h3>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                {defaultAvatars.map((avatar, index) => (
                  <motion.img
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    src={avatar}
                    alt={`头像 ${index + 1}`}
                    className={`w-16 h-16 rounded-full cursor-pointer border-2 transition-all duration-300 ${
                      user.avatar === avatar
                        ? 'border-[#ff6b35] shadow-lg shadow-orange-500/30'
                        : 'border-white/20 hover:border-[#ff6b35]/50'
                    }`}
                    onClick={() => handleUpdateAvatar(avatar)}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="w-full py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;