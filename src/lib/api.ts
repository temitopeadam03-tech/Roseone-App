import {
  User,
  Post,
  Story,
  Conversation,
  Message,
  Community,
  Product,
  NotificationItem,
  UserSettings,
  Comment,
  MarketplaceListing,
  ReportedItem,
  ReactionType,
} from '../types';

const API_BASE = (
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) ||
  ''
).replace(/\/$/, '');

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('rose_auth_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const targetUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    const res = await fetch(targetUrl, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `Request failed: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data && data.error) errorMsg = data.error;
      } catch {
        // Ignore json parse error
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // --- Authentication ---
  public async register(params: {
    name: string;
    handle: string;
    email: string;
    password: string;
    bio?: string;
    avatar?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ success: boolean; user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (typeof localStorage !== 'undefined' && res.token) {
      localStorage.setItem('rose_auth_token', res.token);
    }
    return res;
  }

  public async login(handleOrEmail: string, password: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ handleOrEmail, password }),
    });
    if (typeof localStorage !== 'undefined' && res.token) {
      localStorage.setItem('rose_auth_token', res.token);
    }
    return res;
  }

  public async getCurrentUser(): Promise<User | null> {
    try {
      const res = await this.request<{ success: boolean; user: User }>('/api/auth/me');
      return res.user;
    } catch {
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('rose_auth_token');
      }
    }
  }

  // Bootstrap Snapshot
  public async getBootstrap(userId: string) {
    const res = await this.request<{
      success: boolean;
      data: {
        currentUser: User;
        allUsers: User[];
        posts: Post[];
        comments: Record<string, Comment[]>;
        stories: Story[];
        conversations: Conversation[];
        communities: Community[];
        marketplaceListings: MarketplaceListing[];
        notifications: NotificationItem[];
        reportedItems: ReportedItem[];
        settings: UserSettings;
        blockedUserIds: string[];
        mutedUserIds: string[];
      };
    }>(`/api/bootstrap?userId=${encodeURIComponent(userId)}`);
    return res.data;
  }

  // Media Upload
  public async uploadMedia(dataUrl: string, filename?: string): Promise<string> {
    const res = await this.request<{
      success: boolean;
      url: string;
      filename: string;
      size: number;
    }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename }),
    });
    return res.url;
  }

  // Posts
  public async createPost(
    authorId: string,
    content: string,
    media?: string[],
    pollData?: { question: string; options: string[] },
    tags?: string[],
    communityId?: string
  ): Promise<Post> {
    const res = await this.request<{ success: boolean; post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ authorId, content, media, pollData, tags, communityId }),
    });
    return res.post;
  }

  public async deletePost(postId: string, userId: string): Promise<void> {
    await this.request<{ success: boolean }>(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });
  }

  public async likePost(postId: string, userId: string, reaction?: ReactionType) {
    return this.request<{ success: boolean; post: Post; isLiked: boolean }>(
      `/api/posts/${postId}/like`,
      {
        method: 'POST',
        body: JSON.stringify({ userId, reaction }),
      }
    );
  }

  public async votePoll(postId: string, userId: string, optionId: string) {
    return this.request<{ success: boolean; post: Post }>(`/api/posts/${postId}/poll/vote`, {
      method: 'POST',
      body: JSON.stringify({ userId, optionId }),
    });
  }

  // Comments
  public async addComment(
    postId: string,
    authorId: string,
    content: string,
    voiceUrl?: string,
    voiceDuration?: number,
    parentCommentId?: string
  ): Promise<Comment> {
    const res = await this.request<{ success: boolean; comment: Comment }>(
      `/api/posts/${postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ authorId, content, voiceUrl, voiceDuration, parentCommentId }),
      }
    );
    return res.comment;
  }

  public async deleteComment(postId: string, commentId: string, userId: string, parentCommentId?: string) {
    return this.request<{ success: boolean }>(
      `/api/posts/${postId}/comments/${commentId}${
        parentCommentId ? `?parentCommentId=${encodeURIComponent(parentCommentId)}` : ''
      }`,
      {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      }
    );
  }

  public async toggleLikeComment(postId: string, commentId: string, userId: string) {
    return this.request<{ success: boolean; isLiked: boolean }>(
      `/api/posts/${postId}/comments/${commentId}/like`,
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    );
  }

  // Stories
  public async createStory(
    userId: string,
    mediaType: 'photo' | 'video' | 'text',
    mediaUrl: string,
    caption?: string,
    textContent?: string,
    bgColor?: string,
    audience: 'everyone' | 'followers' | 'close-friends' = 'everyone',
    storyThumbnail?: string
  ): Promise<Story> {
    const res = await this.request<{ success: boolean; story: Story }>('/api/stories', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        mediaType,
        mediaUrl,
        caption,
        textContent,
        bgColor,
        audience,
        storyThumbnail,
      }),
    });
    return res.story;
  }

  public async markStoryViewed(storyId: string, viewerId: string) {
    return this.request<{ success: boolean }>(`/api/stories/${storyId}/view`, {
      method: 'POST',
      body: JSON.stringify({ viewerId }),
    });
  }

  public async reactToStory(storyId: string, userId: string, emoji: string) {
    return this.request<{ success: boolean }>(`/api/stories/${storyId}/react`, {
      method: 'POST',
      body: JSON.stringify({ userId, emoji }),
    });
  }

  public async addStoryComment(
    storyId: string,
    userId: string,
    text?: string,
    voiceUrl?: string,
    voiceDuration?: number
  ) {
    return this.request<{ success: boolean }>(`/api/stories/${storyId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ userId, text, voiceUrl, voiceDuration }),
    });
  }

  public async deleteStory(storyId: string, userId: string) {
    return this.request<{ success: boolean }>(`/api/stories/${storyId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });
  }

  // Users & Profiles
  public async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const res = await this.request<{ success: boolean; user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ userId, updates }),
    });
    return res.user;
  }

  public async toggleFollow(currentUserId: string, targetUserId: string) {
    return this.request<{
      success: boolean;
      isFollowing: boolean;
      targetUser: User;
      currentUser: User;
    }>(`/api/users/${targetUserId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ currentUserId }),
    });
  }

  // Conversations
  public async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    mediaUrl?: string,
    audioDuration?: number
  ): Promise<Message> {
    const res = await this.request<{ success: boolean; message: Message }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ senderId, text, mediaUrl, audioDuration }),
      }
    );
    return res.message;
  }

  public async createConversation(
    currentUserId: string,
    recipientId: string,
    initialMessage?: string
  ): Promise<Conversation> {
    const res = await this.request<{ success: boolean; conversation: Conversation }>(
      '/api/conversations',
      {
        method: 'POST',
        body: JSON.stringify({ currentUserId, recipientId, initialMessage }),
      }
    );
    return res.conversation;
  }

  public async markConversationRead(conversationId: string) {
    return this.request<{ success: boolean }>(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  public async togglePinMessage(conversationId: string, messageId: string) {
    return this.request<{ success: boolean }>(
      `/api/conversations/${conversationId}/messages/${messageId}/pin`,
      { method: 'POST' }
    );
  }

  public async reactToMessage(conversationId: string, messageId: string, emoji: string) {
    return this.request<{ success: boolean }>(
      `/api/conversations/${conversationId}/messages/${messageId}/react`,
      {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }
    );
  }

  // Notifications
  public async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  public async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  // Settings
  public async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const res = await this.request<{ success: boolean; settings: UserSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ userId, updates }),
    });
    return res.settings;
  }

  // Safety & Moderation
  public async submitReport(
    targetType: 'post' | 'user' | 'message' | 'listing',
    targetId: string,
    reason: string,
    reporterHandle: string
  ): Promise<ReportedItem> {
    const res = await this.request<{ success: boolean; report: ReportedItem }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, reason, reporterHandle }),
    });
    return res.report;
  }

  public async getModerationReports(): Promise<ReportedItem[]> {
    const res = await this.request<{ success: boolean; reports: ReportedItem[] }>(
      '/api/moderation/reports'
    );
    return res.reports;
  }

  public async moderationAction(
    reportId: string,
    action: 'resolve' | 'dismiss' | 'delete_content'
  ): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/api/moderation/action', {
      method: 'POST',
      body: JSON.stringify({ reportId, action }),
    });
    return res.success;
  }

  // Marketplace
  public async createListing(
    sellerId: string,
    data: Omit<
      MarketplaceListing,
      'id' | 'seller' | 'status' | 'createdAt' | 'createdTimestamp' | 'viewsCount' | 'sharesCount' | 'isSaved'
    >
  ): Promise<MarketplaceListing> {
    const res = await this.request<{ success: boolean; listing: MarketplaceListing }>(
      '/api/marketplace',
      {
        method: 'POST',
        body: JSON.stringify({ sellerId, data }),
      }
    );
    return res.listing;
  }

  public async updateListing(id: string, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    const res = await this.request<{ success: boolean; listing: MarketplaceListing }>(
      `/api/marketplace/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ updates }),
      }
    );
    return res.listing;
  }

  public async deleteListing(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/marketplace/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // Communities
  public async createCommunity(data: Partial<Community> & { name: string; description: string }): Promise<Community> {
    const res = await this.request<{ success: boolean; community: Community }>('/api/communities', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    return res.community;
  }

  public async joinCommunity(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; isJoined: boolean }>(
      `/api/communities/${id}/join`,
      { method: 'POST' }
    );
    return res.isJoined;
  }
}

export const api = new ApiClient();
