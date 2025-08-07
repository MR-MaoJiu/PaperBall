import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { usePaperStore } from '@/store/paperStore';

import { ArrowLeft, Type, Image, Mic, Video, Send, MapPin, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

type ContentType = 'text' | 'image' | 'audio' | 'video';

const ThrowPaper: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { currentLocation, throwPaper, getCurrentLocation } = usePaperStore();
  
  const [contentType, setContentType] = useState<ContentType>('text');
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isThrowAnimating, setIsThrowAnimating] = useState(false);
  const [accelerationData, setAccelerationData] = useState({ x: 0, y: 0, z: 0 });
  const [isShakeDetected, setIsShakeDetected] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/auth');
      return;
    }
    
    // 获取当前位置
    getCurrentLocation();
    
    // 监听加速度传感器
    if ('DeviceMotionEvent' in window) {
      const handleDeviceMotion = (event: DeviceMotionEvent) => {
        const acceleration = event.accelerationIncludingGravity;
        if (acceleration) {
          const { x = 0, y = 0, z = 0 } = acceleration;
          const safeX = x ?? 0;
          const safeY = y ?? 0;
          const safeZ = z ?? 0;
          setAccelerationData({ x: safeX, y: safeY, z: safeZ });
          
          // 检测摇晃手势（简单的阈值检测）
          const totalAcceleration = Math.sqrt(safeX * safeX + safeY * safeY + safeZ * safeZ);
          if (totalAcceleration > 15) {
            setIsShakeDetected(true);
            setTimeout(() => setIsShakeDetected(false), 1000);
          }
        }
      };
      
      window.addEventListener('devicemotion', handleDeviceMotion);
      return () => window.removeEventListener('devicemotion', handleDeviceMotion);
    }
  }, [user, navigate, getCurrentLocation]);
  
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setMediaFile(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setMediaPreview(audioUrl);
        setMediaFile(audioBlob as File);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('无法访问麦克风');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleThrow = async () => {
    if (!content.trim() && !mediaFile) {
      toast.error('请输入内容或上传媒体文件');
      return;
    }
    
    if (!currentLocation) {
      toast.error('无法获取当前位置');
      return;
    }
    
    setIsThrowAnimating(true);
    
    try {
      const success = await throwPaper(content, contentType, mediaFile || undefined);
      
      if (success) {
        // 播放丢弃动画
        setTimeout(() => {
          toast.success('纸团丢出成功！');
          navigate('/');
        }, 2000);
      } else {
        toast.error('丢纸团失败，请重试');
        setIsThrowAnimating(false);
      }
    } catch (error) {
      toast.error('丢纸团失败，请重试');
      setIsThrowAnimating(false);
    }
  };
  
  const contentTypes = [
    { type: 'text' as ContentType, icon: Type, label: '文字', color: 'from-blue-500 to-blue-600' },
    { type: 'image' as ContentType, icon: Image, label: '图片', color: 'from-green-500 to-green-600' },
    { type: 'audio' as ContentType, icon: Mic, label: '语音', color: 'from-purple-500 to-purple-600' },
    { type: 'video' as ContentType, icon: Video, label: '视频', color: 'from-red-500 to-red-600' },
  ];
  
  if (!user?.isLoggedIn) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      {/* 丢纸团动画覆盖层 */}
      <AnimatePresence>
        {isThrowAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 1, y: 0 }}
              animate={{ 
                scale: [1, 0.8, 0.3],
                y: [0, -200, -800],
                rotate: [0, 180, 720]
              }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="w-20 h-20 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] rounded-full flex items-center justify-center shadow-2xl"
            >
              <span className="text-2xl font-bold">纸</span>
            </motion.div>
            
            {/* 粒子爆炸效果 */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="absolute w-2 h-2 bg-[#ff6b35] rounded-full"
              />
            ))}
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
          
          <h1 className="text-2xl font-bold">丢纸团</h1>
          
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
              <p className="text-sm text-gray-300">丢弃位置</p>
              <p className="font-medium">
                {currentLocation
                  ? `${Number(currentLocation.latitude || 0).toFixed(4)}, ${Number(currentLocation.longitude || 0).toFixed(4)}`
                  : '获取位置中...'}
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* 内容类型选择 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">选择内容类型</h3>
          <div className="grid grid-cols-4 gap-3">
            {contentTypes.map(({ type, icon: Icon, label, color }) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setContentType(type)}
                className={`relative p-4 rounded-xl transition-all duration-300 ${
                  contentType === type
                    ? `bg-gradient-to-r ${color} shadow-lg`
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{label}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* 内容编辑区 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20"
        >
          {contentType === 'text' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你想分享的故事..."
              className="w-full h-32 bg-transparent border-none outline-none text-white placeholder-gray-400 resize-none"
              maxLength={500}
            />
          )}
          
          {contentType === 'image' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-gray-400 rounded-lg hover:border-[#ff6b35] transition-colors"
              >
                {mediaPreview ? (
                  <img src={mediaPreview} alt="预览" className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <div className="text-center">
                    <Image className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">点击上传图片</p>
                  </div>
                )}
              </button>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="为图片添加描述..."
                className="w-full h-20 bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                maxLength={200}
              />
            </div>
          )}
          
          {contentType === 'audio' && (
            <div className="space-y-4">
              <div className="text-center">
                {isRecording ? (
                  <motion.button
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    onClick={stopRecording}
                    className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <div className="w-6 h-6 bg-white rounded-sm" />
                  </motion.button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 bg-[#ff6b35] rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-[#f7931e] transition-colors"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </button>
                )}
                <p className="text-gray-400">
                  {isRecording ? '录音中，点击停止' : '点击开始录音'}
                </p>
              </div>
              
              {mediaPreview && (
                <audio controls className="w-full">
                  <source src={mediaPreview} type="audio/wav" />
                </audio>
              )}
              
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="为语音添加描述..."
                className="w-full h-20 bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                maxLength={200}
              />
            </div>
          )}
          
          {contentType === 'video' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-gray-400 rounded-lg hover:border-[#ff6b35] transition-colors"
              >
                {mediaPreview ? (
                  <video src={mediaPreview} controls className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <div className="text-center">
                    <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">点击上传视频</p>
                  </div>
                )}
              </button>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="为视频添加描述..."
                className="w-full h-20 bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                maxLength={200}
              />
            </div>
          )}
        </motion.div>
        
        {/* 传感器状态 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-[#ff6b35]" />
              <div>
                <p className="text-sm text-gray-300">加速度传感器</p>
                <p className="text-xs text-gray-400">
                  X: {accelerationData.x?.toFixed(1) || '0.0'} Y: {accelerationData.y?.toFixed(1) || '0.0'} Z: {accelerationData.z?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
            {isShakeDetected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-[#ff6b35] rounded-full text-sm font-medium"
              >
                摇晃检测到！
              </motion.div>
            )}
          </div>
        </motion.div>
        
        {/* 丢弃按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleThrow}
            disabled={isThrowAnimating}
            className="w-full py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center space-x-2">
              <Send className="w-6 h-6" />
              <span>{isThrowAnimating ? '丢出中...' : '丢出纸团'}</span>
            </div>
          </motion.button>
          
          {isShakeDetected && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleThrow}
              disabled={isThrowAnimating}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                <Smartphone className="w-6 h-6" />
                <span>摇晃丢出</span>
              </div>
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ThrowPaper;