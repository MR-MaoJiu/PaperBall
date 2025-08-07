export interface Message {
  id: string;
  type: 'comment' | 'reply' | 'like';
  content: string;
  isRead: boolean;
  createdAt: number;
  fromUser: {
    id: string;
    nickname: string;
    avatar: string;
  };
  relatedPaper?: {
    id: string;
    content: string;
    type: 'text' | 'image' | 'audio' | 'video';
  };
  relatedComment?: {
    id: string;
    content: string;
  };
}

export interface MessageNotification {
  id: string;
  userId: string;
  type: 'comment' | 'reply' | 'like';
  message: string;
  isRead: boolean;
  createdAt: number;
  fromUserId: string;
  paperId?: string;
  commentId?: string;
}