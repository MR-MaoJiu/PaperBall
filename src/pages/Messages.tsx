import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { userAPI } from '@/services/api';
import { ArrowLeft, MessageCircle, Reply, Bell, Check, Heart, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/utils/timeUtils';
import { Message } from '@/types/message';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/auth');
      return;
    }

    fetchMessages();
    fetchUnreadCount();
  }, [user, navigate]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getMessages(user!.id.toString());
      if (response.success) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
      toast.error('获取消息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await userAPI.getUnreadCount(user!.id.toString());
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await userAPI.markMessageRead(messageId);
      if (response.success) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      toast.error('标记已读失败');
    }
  };

  const handleMessageClick = async (message: Message) => {
    if (!message.isRead) {
      await markAsRead(message.id);
    }
    
    // 导航到相关纸团详情页
    if (message.relatedPaper) {
      navigate(`/paper/${message.relatedPaper.id}`);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'reply':
        return <Reply className="w-5 h-5 text-green-400" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getMessageText = (message: Message) => {
    switch (message.type) {
      case 'comment':
        return `${message.fromUser.nickname} 评论了你的纸团`;
      case 'reply':
        return `${message.fromUser.nickname} 回复了你的评论`;
      case 'like':
        return `${message.fromUser.nickname} 点赞了你的纸团`;
      default:
        return '新消息';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'border-blue-400/30 bg-blue-400/5';
      case 'reply':
        return 'border-green-400/30 bg-green-400/5';
      case 'like':
        return 'border-red-400/30 bg-red-400/5';
      default:
        return 'border-gray-400/30 bg-gray-400/5';
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadMessages = messages.filter(msg => !msg.isRead);
      await Promise.all(
        unreadMessages.map(msg => userAPI.markMessageRead(msg.id))
      );
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      setUnreadCount(0);
      toast.success('已标记所有消息为已读');
    } catch (error) {
      console.error('批量标记已读失败:', error);
      toast.error('操作失败');
    }
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
          
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">消息中心</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1 px-3 py-1 bg-[#ff6b35] text-white rounded-lg text-sm hover:bg-[#f7931e] transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>全部已读</span>
            </button>
          )}
        </motion.div>

        {/* 消息列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-[#ff6b35] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">暂无消息</p>
              <p className="text-sm">当有人评论或回复你时，消息会显示在这里</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleMessageClick(message)}
                  className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 border transition-all duration-300 cursor-pointer hover:bg-white/15 ${
                    message.isRead 
                      ? 'border-white/20' 
                      : `${getMessageColor(message.type)} border-[#ff6b35]/50`
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* 头像 */}
                    <img
                      src={message.fromUser.avatar}
                      alt={message.fromUser.nickname}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                    />
                    
                    {/* 消息内容 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <img
                            src={message.fromUser.avatar}
                            alt="用户头像"
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium text-white">
                            {message.fromUser.nickname}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">
                            {formatTimeAgo(message.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 mb-2">
                        {getMessageIcon(message.type)}
                        <span className="text-sm text-gray-400">
                          {getMessageText(message)}
                        </span>
                      </div>
                      
                      {message.content && (
                        <p className="text-gray-300 mt-2 text-sm">
                          "{message.content}"
                        </p>
                      )}
                      
                      {message.relatedComment && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-gray-400 text-xs mb-1">相关评论:</p>
                          <p className="text-gray-300 text-sm">
                            {message.relatedComment.content}
                          </p>
                        </div>
                      )}
                      
                      {message.relatedPaper && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-gray-400 text-xs mb-1">相关纸团:</p>
                          <p className="text-gray-300 text-sm line-clamp-2">
                            {message.relatedPaper.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;