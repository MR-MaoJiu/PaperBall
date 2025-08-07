import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userAPI } from '@/services/api';
import { toast } from 'sonner';

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  isLoggedIn: boolean;
}

interface UserState {
  user: User | null;
  defaultAvatars: string[];
  isLoading: boolean;
  login: (nickname: string, password: string) => Promise<boolean>;
  register: (nickname: string, password: string, avatar?: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (avatar: string) => Promise<boolean>;
  updateNickname: (nickname: string) => Promise<boolean>;
  checkNicknameAvailability: (nickname: string) => Promise<boolean>;
}

const defaultAvatars = [
  // 男生头像
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20boy%20avatar%20round%20face%20blue%20background%20short%20hair&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20boy%20avatar%20round%20face%20green%20background%20glasses&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20boy%20avatar%20round%20face%20purple%20background%20cap&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20boy%20avatar%20round%20face%20orange%20background%20smile&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20boy%20avatar%20round%20face%20cyan%20background%20cool&image_size=square',
  
  // 女生头像
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20girl%20avatar%20round%20face%20pink%20background%20long%20hair&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20girl%20avatar%20round%20face%20purple%20background%20ponytail&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20girl%20avatar%20round%20face%20yellow%20background%20bow&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20girl%20avatar%20round%20face%20red%20background%20curly%20hair&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20girl%20avatar%20round%20face%20lavender%20background%20braids&image_size=square',
  
  // 小动物头像
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20cat%20avatar%20round%20face%20blue%20background%20whiskers&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20dog%20avatar%20round%20face%20green%20background%20floppy%20ears&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20panda%20avatar%20round%20face%20purple%20background%20bamboo&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20rabbit%20avatar%20round%20face%20pink%20background%20long%20ears&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20fox%20avatar%20round%20face%20orange%20background%20fluffy%20tail&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20bear%20avatar%20round%20face%20brown%20background%20honey&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20owl%20avatar%20round%20face%20teal%20background%20big%20eyes&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20penguin%20avatar%20round%20face%20ice%20blue%20background%20scarf&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20koala%20avatar%20round%20face%20eucalyptus%20green%20background&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20hamster%20avatar%20round%20face%20golden%20background%20cheeks&image_size=square',
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      defaultAvatars,
      isLoading: false,
      
      login: async (nickname: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await userAPI.login(nickname, password);
          
          if (response.success && response.user && response.token) {
            // 确保用户状态包含登录标识
            const userWithLoginStatus = {
              ...response.user,
              isLoggedIn: true
            };
            
            set({
              user: userWithLoginStatus,
              isLoading: false,
            });
            
            console.log('登录成功，用户状态:', userWithLoginStatus);
            console.log('Token已保存:', response.token);
            toast.success('登录成功！');
            return true;
          }
          
          toast.error('登录失败，请检查用户名和密码');
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          toast.error(error.message || '登录失败');
          set({ isLoading: false });
          return false;
        }
      },
      
      register: async (nickname: string, password: string, avatar?: string) => {
        set({ isLoading: true });
        try {
          const response = await userAPI.register(nickname, password, avatar);
          
          if (response.success && response.user && response.token) {
            // 确保用户状态包含登录标识
            const userWithLoginStatus = {
              ...response.user,
              isLoggedIn: true
            };
            
            set({
              user: userWithLoginStatus,
              isLoading: false,
            });
            
            console.log('注册成功，用户状态:', userWithLoginStatus);
            console.log('Token已保存:', response.token);
            toast.success('注册成功！');
            return true;
          }
          
          toast.error('注册失败');
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          toast.error(error.message || '注册失败');
          set({ isLoading: false });
          return false;
        }
      },
      
      logout: () => {
        userAPI.logout();
        set({ user: null });
        toast.success('已退出登录');
      },
      
      updateAvatar: async (avatar: string) => {
        const { user } = get();
        if (!user) return false;
        
        try {
          const response = await userAPI.updateAvatar(user.id, avatar);
          
          if (response.success) {
            set({
              user: { ...user, avatar: response.avatar }
            });
            toast.success('头像更新成功！');
            return true;
          }
          
          toast.error('头像更新失败');
          return false;
        } catch (error: any) {
          toast.error(error.message || '头像更新失败');
          return false;
        }
      },
      
      updateNickname: async (nickname: string) => {
        const { user } = get();
        if (!user) return false;
        
        try {
          const response = await userAPI.updateNickname(user.id, nickname);
          
          if (response.success) {
            set({
              user: { ...user, nickname: response.nickname }
            });
            toast.success('昵称更新成功！');
            return true;
          }
          
          toast.error('昵称更新失败');
          return false;
        } catch (error: any) {
          toast.error(error.message || '昵称更新失败');
          return false;
        }
      },
      
      checkNicknameAvailability: async (nickname: string) => {
        try {
          const response = await userAPI.checkNickname(nickname);
          return response.success && response.available;
        } catch (error: any) {
          console.error('检查昵称可用性失败:', error);
          return false;
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// 将store暴露到全局，方便其他store访问
(window as any).userStore = useUserStore;