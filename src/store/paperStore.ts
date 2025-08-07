import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { paperAPI, mediaAPI, userAPI } from '@/services/api';
import { toast } from 'sonner';
import { normalizeTimestamp } from '@/utils/timeUtils';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Paper {
  id: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'video';
  mediaUrl?: string;
  location: Location;
  timestamp: number;
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isCollected: boolean;
  distance?: number;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  timestamp: number;
  likes: number;
  isLiked: boolean;
  parentId?: string;
}

// PaperBall 是 Paper 的别名，用于向后兼容
export type PaperBall = Paper;

interface PaperState {
  papers: Paper[];
  currentLocation: Location | null;
  isLocationLoading: boolean;
  isThrowingPaper: boolean;
  searchRadius: number;
  throwPaper: (content: string, type: 'text' | 'image' | 'audio' | 'video', mediaFile?: File) => Promise<boolean>;
  searchNearbyPapers: (radius?: number) => Promise<Paper[]>;
  getCurrentLocation: () => Promise<void>;
  likePaper: (paperId: string) => Promise<boolean>;
  collectPaper: (paperId: string) => void;
  addComment: (paperId: string, content: string, parentId?: string) => Promise<boolean>;
  likeComment: (paperId: string, commentId: string) => void;
  getUserPapers: (userId: string) => Promise<Paper[]>;
  getUserCommentedPapers: (userId: string) => Promise<Paper[]>;
  calculateDistance: (location1: Location, location2: Location) => number;
}

// 计算两点间距离（米）
export const calculateDistance = (location1: Location, location2: Location): number => {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (location1.latitude * Math.PI) / 180;
  const φ2 = (location2.latitude * Math.PI) / 180;
  const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
  const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const usePaperStore = create<PaperState>()(
  persist(
    (set, get) => ({
      papers: [],
      currentLocation: null,
      isLocationLoading: false,
      isThrowingPaper: false,
      searchRadius: 1000, // 1000米范围（1公里）

      getCurrentLocation: async () => {
        set({ isLocationLoading: true });
        
        try {
          if ('geolocation' in navigator) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
              });
            });
            
            set({
              currentLocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              isLocationLoading: false,
            });
          } else {
            throw new Error('Geolocation not supported');
          }
        } catch (error) {
          console.error('获取位置失败:', error);
          // 使用模拟位置（北京天安门）
          set({
            currentLocation: {
              latitude: 39.9042,
              longitude: 116.4074,
            },
            isLocationLoading: false,
          });
        }
      },

      throwPaper: async (content: string, type: 'text' | 'image' | 'audio' | 'video', mediaFile?: File) => {
        const { currentLocation } = get();
        
        if (!currentLocation) {
          await get().getCurrentLocation();
          const updatedLocation = get().currentLocation;
          if (!updatedLocation) {
            toast.error('无法获取位置信息');
            return false;
          }
        }
        
        // 获取当前用户信息
        const userStore = (window as any).userStore?.getState();
        const currentUser = userStore?.user;
        
        if (!currentUser) {
          toast.error('请先登录');
          return false;
        }
        
        set({ isThrowingPaper: true });
        
        try {
          let mediaUrl: string | undefined;
          
          // 处理媒体文件上传
          if (mediaFile) {
            try {
              mediaUrl = await mediaAPI.uploadFile(mediaFile);
            } catch (error) {
              toast.error('文件上传失败');
              set({ isThrowingPaper: false });
              return false;
            }
          }
          
          const response = await paperAPI.throwPaper({
            content,
            type,
            mediaUrl,
            location: get().currentLocation!,
          });
          
          if (response.success && response.paper) {
            const paper = response.paper;
            // 转换数据结构以匹配前端期望的格式
            const normalizedPaper = {
              id: paper.id,
              content: paper.content,
              type: paper.type,
              mediaUrl: paper.mediaUrl,
              location: {
                latitude: paper.latitude || 0,
                longitude: paper.longitude || 0
              },
              timestamp: normalizeTimestamp(paper.createdAt || paper.timestamp || Date.now()),
              author: {
                id: paper.authorId,
                nickname: paper.authorNickname,
                avatar: paper.authorAvatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square'
              },
              likes: paper.likes || 0,
              comments: [],
              isLiked: false,
              isCollected: false
            };
            
            // 更新本地papers列表
            set((state) => ({
              papers: [...state.papers, normalizedPaper],
              isThrowingPaper: false,
            }));
            
            toast.success('纸团丢出成功！');
            return true;
          }
          
          toast.error('丢纸团失败');
          set({ isThrowingPaper: false });
          return false;
        } catch (error: any) {
          toast.error(error.message || '丢纸团失败');
          set({ isThrowingPaper: false });
          return false;
        }
      },

      searchNearbyPapers: async (radius?: number) => {
        let { currentLocation } = get();
        
        if (!currentLocation) {
          await get().getCurrentLocation();
          currentLocation = get().currentLocation;
          if (!currentLocation) {
            toast.error('无法获取位置信息');
            return [];
          }
        }
        
        try {
          const response = await paperAPI.searchNearby({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            radius: radius || get().searchRadius,
          });
          
          if (response.success && response.papers) {
            // 计算距离并排序
            const papersWithDistance = response.papers.map((paper: any) => {
              // 处理后端返回的数据结构，确保location对象存在
              const paperLocation = paper.location || {
                latitude: paper.latitude || 0,
                longitude: paper.longitude || 0
              };
              
              return {
                id: paper.id,
                content: paper.content,
                type: paper.type,
                mediaUrl: paper.mediaUrl,
                location: paperLocation,
                timestamp: normalizeTimestamp(paper.createdAt || paper.timestamp || Date.now()),
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
                  timestamp: normalizeTimestamp(comment.createdAt || comment.timestamp || Date.now()),
                  likes: comment.likes || 0,
                  isLiked: comment.isLiked || false,
                  parentId: comment.parentId
                })),
                isLiked: paper.isLiked || false,
                isCollected: paper.isCollected || false,
                distance: calculateDistance(
                  currentLocation,
                  paperLocation
                ),
              };
            }).sort((a: any, b: any) => a.distance - b.distance);
            
            set({ papers: papersWithDistance });
            return papersWithDistance;
          }
          
          return [];
        } catch (error: any) {
          console.error('搜索附近纸团失败:', error);
          return [];
        }
      },

      likePaper: async (paperId: string) => {
        try {
          const response = await paperAPI.likePaper(paperId);
          
          if (response.success) {
            // 更新本地状态
            set((state) => ({
              papers: state.papers.map((paper) =>
                paper.id === paperId
                  ? {
                      ...paper,
                      likes: paper.likes + 1,
                      isLiked: true,
                    }
                  : paper
              ),
            }));
            
            // 创建消息通知
            try {
              const currentPaper = get().papers.find(p => p.id === paperId);
              const userStore = (window as any).userStore?.getState();
              const currentUser = userStore?.user;
              
              if (currentPaper && currentUser && currentPaper.author.id !== currentUser.id) {
                await userAPI.createMessage({
                  userId: currentPaper.author.id,
                  type: 'like',
                  message: `${currentUser.nickname} 点赞了你的纸团`,
                  fromUserId: currentUser.id,
                  paperId: paperId
                });
              }
            } catch (error) {
              console.error('创建点赞消息通知失败:', error);
            }
            
            return true;
          }
          
          return false;
        } catch (error: any) {
          console.error('点赞失败:', error);
          return false;
        }
      },

      collectPaper: (paperId: string) => {
        // 本地收藏功能，可以后续扩展为API调用
        set((state) => ({
          papers: state.papers.map((paper) =>
            paper.id === paperId
              ? { ...paper, isCollected: !paper.isCollected }
              : paper
          ),
        }));
      },

      addComment: async (paperId: string, content: string, parentId?: string) => {
        try {
          const response = await paperAPI.addComment(paperId, content, parentId);
          
          if (response.success && response.comment) {
            const comment = response.comment;
            // 处理评论的时间戳格式和数据结构转换
            const normalizedComment = {
              id: comment.id,
              content: comment.content,
              author: {
                id: comment.authorId,
                nickname: comment.authorNickname,
                avatar: comment.authorAvatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20round%20face%20blue%20background&image_size=square'
              },
              timestamp: normalizeTimestamp(comment.createdAt || comment.timestamp || Date.now()),
              likes: comment.likes || 0,
              isLiked: comment.isLiked || false,
              parentId: comment.parentId
            };
            
            set((state) => ({
              papers: state.papers.map((paper) =>
                paper.id === paperId
                  ? { ...paper, comments: [...paper.comments, normalizedComment] }
                  : paper
              ),
            }));
            
            // 创建消息通知
            try {
              const currentPaper = get().papers.find(p => p.id === paperId);
              if (currentPaper && currentPaper.author.id !== normalizedComment.author.id) {
                await userAPI.createMessage({
                  userId: currentPaper.author.id,
                  type: parentId ? 'reply' : 'comment',
                  message: parentId ? `${normalizedComment.author.nickname} 回复了你的评论` : `${normalizedComment.author.nickname} 评论了你的纸团`,
                  fromUserId: normalizedComment.author.id,
                  paperId: paperId,
                  commentId: parentId || normalizedComment.id
                });
              }
            } catch (error) {
              console.error('创建消息通知失败:', error);
            }
            
            toast.success(parentId ? '回复成功！' : '评论成功！');
            return true;
          }
          
          toast.error(parentId ? '回复失败' : '评论失败');
          return false;
        } catch (error: any) {
          toast.error(error.message || (parentId ? '回复失败' : '评论失败'));
          return false;
        }
      },

      likeComment: (paperId: string, commentId: string) => {
        // 本地点赞评论功能，可以后续扩展为API调用
        set((state) => ({
          papers: state.papers.map((paper) =>
            paper.id === paperId
              ? {
                  ...paper,
                  comments: paper.comments.map((comment) =>
                    comment.id === commentId
                      ? {
                          ...comment,
                          isLiked: !comment.isLiked,
                          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                        }
                      : comment
                  ),
                }
              : paper
          ),
        }));
      },

      getUserPapers: async (userId: string) => {
        try {
          const response = await paperAPI.getUserPapers(userId);
          
          if (response.success && response.papers) {
            // 处理时间戳格式和数据结构转换
            const normalizedPapers = response.papers.map((paper: any) => ({
              id: paper.id,
              content: paper.content,
              type: paper.type,
              mediaUrl: paper.mediaUrl,
              location: {
                latitude: paper.latitude || 0,
                longitude: paper.longitude || 0
              },
              timestamp: normalizeTimestamp(paper.createdAt || paper.timestamp || Date.now()),
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
                timestamp: normalizeTimestamp(comment.createdAt || comment.timestamp || Date.now()),
                likes: comment.likes || 0,
                isLiked: comment.isLiked || false,
                parentId: comment.parentId
              })),
              isLiked: paper.isLiked || false,
              isCollected: paper.isCollected || false
            }));
            return normalizedPapers;
          }
          
          return [];
        } catch (error: any) {
          console.error('获取用户纸团失败:', error);
          return [];
        }
      },

      getUserCommentedPapers: async (userId: string) => {
        try {
          const response = await userAPI.getUserCommentedPapers(userId);
          
          if (response.success && response.papers) {
            // 处理时间戳格式和数据结构转换
            const normalizedPapers = response.papers.map((paper: any) => ({
              id: paper.id,
              content: paper.content,
              type: paper.type,
              mediaUrl: paper.mediaUrl,
              location: {
                latitude: paper.latitude || 0,
                longitude: paper.longitude || 0
              },
              timestamp: normalizeTimestamp(paper.createdAt || paper.timestamp || Date.now()),
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
                timestamp: normalizeTimestamp(comment.createdAt || comment.timestamp || Date.now()),
                likes: comment.likes || 0,
                isLiked: comment.isLiked || false,
                parentId: comment.parentId
              })),
              isLiked: paper.isLiked || false,
              isCollected: paper.isCollected || false
            }));
            return normalizedPapers;
          }
          
          return [];
        } catch (error: any) {
          console.error('获取用户评论过的纸团失败:', error);
          return [];
        }
      },



      calculateDistance,
    }),
    {
      name: 'paper-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// 将store暴露到全局，方便其他store访问
(window as any).paperStore = usePaperStore;