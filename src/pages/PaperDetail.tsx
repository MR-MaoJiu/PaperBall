import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { usePaperStore, PaperBall, Comment } from '@/store/paperStore';
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Clock, Send, Play, Pause, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/utils/timeUtils';
import { paperAPI } from '@/services/api';

const PaperDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUserStore();
  const { papers, likePaper, addComment } = usePaperStore();
  
  const [paper, setPaper] = useState<PaperBall | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/auth');
      return;
    }
    
    if (!id) {
      navigate('/');
      return;
    }
    
    // 获取纸团详情
    const fetchPaperDetails = async () => {
      setIsLoading(true);
      try {
        // 首先尝试从本地papers数组中查找
        if (papers && Array.isArray(papers)) {
          const foundPaper = papers.find(p => p.id === id);
          if (foundPaper) {
            setPaper(foundPaper);
            setIsLiked(foundPaper.isLiked || false);
            setIsLoading(false);
            return;
          }
        }
        
        // 如果本地没有找到，则从API获取
        const response = await paperAPI.getPaperDetail(id!);
        if (response.success && response.paper) {
          const paper = response.paper;
          const normalizedPaper = {
            id: paper.id,
            content: paper.content,
            type: paper.type,
            mediaUrl: paper.mediaUrl,
            location: {
              latitude: paper.latitude || 0,
              longitude: paper.longitude || 0
            },
            timestamp: paper.createdAt || paper.timestamp || Date.now(),
            author: {
              id: paper.authorId,
              nickname: paper.authorNickname,
              avatar: paper.authorAvatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square'
            },
            likes: paper.likes || 0,
            comments: (paper.comments || []).map((comment: any) => ({
              id: comment.id,
              content: comment.content,
              author: {
                id: comment.authorId,
                nickname: comment.authorNickname,
                avatar: comment.authorAvatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square'
              },
              timestamp: comment.createdAt || comment.timestamp || Date.now(),
              likes: comment.likes || 0,
              isLiked: comment.isLiked || false,
              parentId: comment.parentId
            })),
            isLiked: paper.isLiked || false,
            isCollected: paper.isCollected || false
          };
          setPaper(normalizedPaper);
          setIsLiked(normalizedPaper.isLiked || false);
        } else {
          toast.error('纸团不存在或已被删除');
          navigate('/');
        }
      } catch (error) {
        console.error('获取纸团详情失败:', error);
        toast.error('获取纸团详情失败');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaperDetails();
  }, [id, user, navigate, papers]);
  
  const handleLike = () => {
    if (!paper || !user) return;
    
    likePaper(paper.id);
    setIsLiked(!isLiked);
    
    // 更新本地状态
    setPaper(prev => prev ? { ...prev, likes: prev.likes + (isLiked ? -1 : 1) } : null);
    
    toast.success(isLiked ? '取消点赞' : '点赞成功');
  };
  
  const handleAddComment = async () => {
    if (!paper || !user || !newComment.trim()) return;
    
    try {
      await addComment(paper.id, newComment.trim());
      
      // 更新本地状态
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        author: {
          id: user.id || '',
          nickname: user.nickname || '匿名用户',
          avatar: user.avatar || '/default-avatar.png',
        },
        timestamp: Date.now(),
        likes: 0,
        isLiked: false,
      };
      
      setPaper(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), newCommentObj]
      } : null);
      
      setNewComment('');
      toast.success('评论发布成功');
    } catch (error) {
      toast.error('评论发布失败');
    }
  };
  
  const handleAddReply = async (parentId: string) => {
    if (!paper || !user || !replyContent.trim()) return;
    
    try {
      await addComment(paper.id, replyContent.trim(), parentId);
      
      // 更新本地状态 - 这里简化处理，实际应该重新获取评论列表
      const newReplyObj: Comment = {
        id: Date.now().toString(),
        content: replyContent.trim(),
        author: {
          id: user.id || '',
          nickname: user.nickname || '匿名用户',
          avatar: user.avatar || '/default-avatar.png',
        },
        timestamp: Date.now(),
        likes: 0,
        isLiked: false,
        parentId,
      };
      
      setPaper(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), newReplyObj]
      } : null);
      
      setReplyContent('');
      setReplyingTo(null);
      toast.success('回复发布成功');
    } catch (error) {
      toast.error('回复发布失败');
    }
  };
  
  // 获取顶级评论（没有parentId的评论）
  const getTopLevelComments = () => {
    return (paper?.comments || []).filter(comment => !comment.parentId);
  };
  
  // 获取某个评论的回复
  const getReplies = (commentId: string) => {
    return (paper?.comments || []).filter(comment => comment.parentId === commentId);
  };
  
  const handleShare = async () => {
    if (!paper) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: '纸团分享',
          text: `来看看这个有趣的纸团：${paper.content.substring(0, 50)}...`,
          url: window.location.href,
        });
      } else {
        // 复制链接到剪贴板
        await navigator.clipboard.writeText(window.location.href);
        toast.success('链接已复制到剪贴板');
      }
    } catch (error) {
      toast.error('分享失败');
    }
  };
  
  const toggleAudio = () => {
    if (!audioRef) return;
    
    if (isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(!isPlaying);
  };
  

  
  if (!user?.isLoggedIn) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">加载纸团详情中...</p>
        </div>
      </div>
    );
  }
  
  if (!paper) {
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
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>返回</span>
          </button>
          
          <h1 className="text-xl font-bold">纸团详情</h1>
          
          <button
            onClick={handleShare}
            className="p-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </motion.div>
        
        {/* 纸团卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20"
        >
          {/* 作者信息 */}
          <div className="flex items-center space-x-4 mb-6">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={paper.author?.avatar || '/default-avatar.png'}
              alt="头像"
              className="w-16 h-16 rounded-full border-2 border-[#ff6b35] shadow-lg"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{paper.author?.nickname || '匿名用户'}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeAgo(paper.timestamp)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{Number(paper.location?.latitude || 0).toFixed(4)}, {Number(paper.location?.longitude || 0).toFixed(4)}</span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 bg-[#ff6b35]/20 text-[#ff6b35] rounded-full text-sm font-medium">
              {paper.type === 'text' ? '文字' : 
               paper.type === 'image' ? '图片' :
               paper.type === 'audio' ? '语音' : '视频'}
            </div>
          </div>
          
          {/* 内容展示 */}
          <div className="mb-6">
            {paper.type === 'text' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg leading-relaxed text-gray-100"
              >
                {paper.content}
              </motion.p>
            )}
            
            {paper.type === 'image' && (
              <div className="space-y-4">
                <motion.img
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  src={paper.mediaUrl}
                  alt="图片内容"
                  className="w-full rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => {
                    // 全屏查看图片
                    const img = new Image();
                    img.src = paper.mediaUrl!;
                    const newWindow = window.open();
                    newWindow?.document.write(`<img src="${paper.mediaUrl}" style="width:100%;height:100%;object-fit:contain;" />`);
                  }}
                />
                {paper.content && (
                  <p className="text-gray-300">{paper.content}</p>
                )}
              </div>
            )}
            
            {paper.type === 'audio' && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-6 text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleAudio}
                    className="w-16 h-16 bg-[#ff6b35] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
                  </motion.button>
                  <p className="text-gray-300 mb-2">点击播放语音</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <Volume2 className="w-4 h-4" />
                    <span>语音消息</span>
                  </div>
                  <audio
                    ref={setAudioRef}
                    src={paper.mediaUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
                {paper.content && (
                  <p className="text-gray-300">{paper.content}</p>
                )}
              </div>
            )}
            
            {paper.type === 'video' && (
              <div className="space-y-4">
                <video
                  controls
                  className="w-full rounded-xl shadow-lg"
                  poster={paper.mediaUrl}
                >
                  <source src={paper.mediaUrl} type="video/mp4" />
                  您的浏览器不支持视频播放。
                </video>
                {paper.content && (
                  <p className="text-gray-300">{paper.content}</p>
                )}
              </div>
            )}
          </div>
          
          {/* 互动按钮 */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{paper.likes}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="font-medium">{paper.comments?.length || 0}</span>
              </motion.button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="px-4 py-2 bg-[#ff6b35]/20 text-[#ff6b35] rounded-lg hover:bg-[#ff6b35]/30 transition-colors"
            >
              分享
            </motion.button>
          </div>
        </motion.div>
        
        {/* 评论区 */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-6"
            >
              {/* 评论输入 */}
              <div className="flex space-x-3">
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt="我的头像"
                  className="w-10 h-10 rounded-full border-2 border-[#ff6b35]"
                />
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all duration-300"
                    maxLength={200}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#f7931e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              
              {/* 评论列表 */}
              <div className="space-y-4">
                {getTopLevelComments().length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>还没有评论，来发表第一条评论吧！</p>
                  </div>
                ) : (
                  getTopLevelComments().map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-3"
                    >
                      {/* 主评论 */}
                      <div className="flex space-x-3 p-3 bg-white/5 rounded-lg">
                        <img
                          src={comment.author?.avatar || '/default-avatar.png'}
                          alt="评论者头像"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{comment.author?.nickname || '匿名用户'}</span>
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(comment.timestamp || Date.now())}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs text-[#ff6b35] hover:text-[#f7931e] transition-colors"
                          >
                            {replyingTo === comment.id ? '取消回复' : '回复'}
                          </button>
                        </div>
                      </div>
                      
                      {/* 回复输入框 */}
                      {replyingTo === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-11 flex space-x-2"
                        >
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`回复 ${comment.author?.nickname || '匿名用户'}...`}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all duration-300 text-sm"
                            maxLength={200}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddReply(comment.id);
                              }
                            }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddReply(comment.id)}
                            disabled={!replyContent.trim()}
                            className="px-3 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#f7931e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <Send className="w-3 h-3" />
                          </motion.button>
                        </motion.div>
                      )}
                      
                      {/* 回复列表 */}
                      {getReplies(comment.id).map((reply, replyIndex) => (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (index + replyIndex + 1) * 0.1 }}
                          className="ml-11 space-y-2"
                        >
                          <div className="flex space-x-3 p-3 bg-white/3 rounded-lg border-l-2 border-[#ff6b35]/30">
                            <img
                              src={reply.author?.avatar || '/default-avatar.png'}
                              alt="回复者头像"
                              className="w-6 h-6 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-xs">{reply.author?.nickname || '匿名用户'}</span>
                                <span className="text-xs text-gray-400">
                                  {formatTimeAgo(reply.timestamp || Date.now())}
                                </span>
                              </div>
                              <p className="text-gray-300 text-xs mb-2">{reply.content}</p>
                              <button
                                onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                                className="text-xs text-[#ff6b35] hover:text-[#f7931e] transition-colors"
                              >
                                {replyingTo === reply.id ? '取消回复' : '回复'}
                              </button>
                            </div>
                          </div>
                          
                          {/* 二级回复输入框 */}
                          {replyingTo === reply.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex space-x-2"
                            >
                              <input
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`回复 ${reply.author?.nickname || '匿名用户'}...`}
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all duration-300 text-sm"
                                maxLength={200}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddReply(comment.id); // 回复到原始评论，保持二级结构
                                  }
                                }}
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAddReply(comment.id)} // 回复到原始评论，保持二级结构
                                disabled={!replyContent.trim()}
                                className="px-3 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#f7931e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                <Send className="w-3 h-3" />
                              </motion.button>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaperDetail;