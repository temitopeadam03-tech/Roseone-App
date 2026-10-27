import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  User,
  Post,
  Story,
  Conversation,
  Message,
  Community,
  CommunityRule,
  CommunityAnnouncement,
  CommunityEvent,
  Product,
  CreatorAnalytics,
  NotificationItem,
  UserSettings,
  DeviceMode,
  AndroidTab,
  AndroidSettingsSection,
  ReportedItem,
  Comment,
  MarketplaceListing,
  ListingStatus,
  ReactionType,
  StoryComment,
} from '../types';
import {
  DEFAULT_CURRENT_USER,
  INITIAL_STORIES,
  INITIAL_POSTS,
  INITIAL_CONVERSATIONS,
  INITIAL_COMMUNITIES,
  INITIAL_PRODUCTS,
  INITIAL_MARKETPLACE_LISTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_COMMENTS,
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface AppContextType {
  // Device & Navigation
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  activeTab: AndroidTab;
  setActiveTab: (tab: AndroidTab) => void;
  activeView: 'feed' | 'communities' | 'creator-hub' | 'settings' | 'reels' | 'saved' | 'moderation' | 'marketplace' | 'profile';
  setActiveView: (view: 'feed' | 'communities' | 'creator-hub' | 'settings' | 'reels' | 'saved' | 'moderation' | 'marketplace' | 'profile') => void;
  activeCommunityId: string | null;
  setActiveCommunityId: (id: string | null) => void;
  isAndroidDrawerOpen: boolean;
  setIsAndroidDrawerOpen: (open: boolean) => void;

  // Settings stack (Android back-stack support)
  activeSettingsSection: AndroidSettingsSection;
  setActiveSettingsSection: (section: AndroidSettingsSection) => void;
  settingsHistory: AndroidSettingsSection[];
  pushSettingsSection: (section: AndroidSettingsSection) => void;
  popSettingsSection: () => void;

  // Authentication & User Accounts
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (handleOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, handle: string, email: string, password: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  currentUser: User;
  allUsers: User[];
  switchUser: (userId: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  viewingUser: User | null;
  setViewingUser: (user: User | null) => void;
  toggleFollowUser: (targetUserId: string) => void;
  acceptFollowRequest: (notificationId: string, requesterUserId: string) => void;
  declineFollowRequest: (notificationId: string) => void;

  // Posts & Interactions
  posts: Post[];
  comments: Record<string, Comment[]>;
  createPost: (content: string, media?: string[], pollData?: { question: string; options: string[] }, tags?: string[], communityId?: string) => void;
  toggleLikePost: (postId: string) => void;
  reactToPost: (postId: string, reaction: ReactionType) => void;
  toggleSavePost: (postId: string) => void;
  toggleRepostPost: (postId: string) => void;
  resharePostWithQuote: (originalPostId: string, quoteCaption?: string) => void;
  votePoll: (postId: string, optionId: string) => void;
  deletePost: (postId: string) => void;
  addComment: (postId: string, content: string, replyToCommentId?: string) => void;
  addVoiceComment: (postId: string, voiceUrl: string, voiceDuration: number, textCaption?: string, replyToCommentId?: string) => void;
  deleteComment: (postId: string, commentId: string, isReply?: boolean, parentCommentId?: string) => void;
  toggleLikeComment: (postId: string, commentId: string) => void;

  // Stories
  stories: Story[];
  createStory: (
    mediaType: 'photo' | 'video' | 'text',
    mediaUrl: string,
    caption?: string,
    textContent?: string,
    bgColor?: string,
    audience?: 'everyone' | 'followers' | 'close-friends',
    storyThumbnail?: string
  ) => void;
  markStoryViewed: (storyId: string) => void;
  reactToStory: (storyId: string, emoji: string) => void;
  addStoryComment: (storyId: string, text?: string, voiceUrl?: string, voiceDuration?: number) => void;
  deleteStory: (storyId: string) => void;
  activeStoryIndex: number | null;
  setActiveStoryIndex: (index: number | null) => void;
  reshareModalPost: Post | null;
  setReshareModalPost: (post: Post | null) => void;

  // Messaging
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, text: string, mediaUrl?: string, audioDuration?: number) => void;
  startNewConversation: (recipientName: string, recipientHandle: string, initialMessage?: string) => void;
  togglePinMessage: (conversationId: string, messageId: string) => void;
  reactToMessage: (conversationId: string, messageId: string, emoji: string) => void;

  // Communities & Groups
  communities: Community[];
  createCommunity: (name: string, description: string, isPrivate: boolean) => void;
  createCommunityDetailed: (data: Partial<Community> & { name: string; description: string }) => Community;
  updateCommunity: (communityId: string, updates: Partial<Community>) => void;
  deleteCommunity: (communityId: string) => void;
  joinCommunity: (communityId: string) => void;
  leaveCommunity: (communityId: string) => void;
  switchCommunityChannel: (communityId: string, channelName: string) => void;
  approvePendingMember: (communityId: string, applicantId: string) => void;
  rejectPendingMember: (communityId: string, applicantId: string) => void;
  addCommunityAnnouncement: (communityId: string, title: string, content: string) => void;
  deleteCommunityAnnouncement: (communityId: string, announcementId: string) => void;
  addCommunityEvent: (communityId: string, event: { title: string; description?: string; date: string; time: string; location: string }) => void;
  toggleCommunityEventRsvp: (communityId: string, eventId: string) => void;
  togglePinPostInCommunity: (communityId: string, postId: string) => void;
  addCommunityChannel: (communityId: string, channelName: string) => void;
  deleteCommunityChannel: (communityId: string, channelName: string) => void;
  addCommunityRule: (communityId: string, title: string, description: string) => void;
  deleteCommunityRule: (communityId: string, ruleId: string) => void;
  assignMemberRole: (communityId: string, userId: string, role: 'admin' | 'moderator' | 'member') => void;
  removeMemberFromCommunity: (communityId: string, userId: string) => void;
  isCreateCommunityOpen: boolean;
  setIsCreateCommunityOpen: (open: boolean) => void;
  createCommunityInitialType: 'community' | 'group';
  openCreateCommunity: (type?: 'community' | 'group') => void;
  communityDashboardTab: 'feed' | 'about' | 'members' | 'events' | 'announcements' | 'settings';
  setCommunityDashboardTab: (tab: 'feed' | 'about' | 'members' | 'events' | 'announcements' | 'settings') => void;

  // Creator
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'salesCount' | 'rating'>) => void;
  analytics: CreatorAnalytics;

  // Marketplace
  marketplaceListings: MarketplaceListing[];
  createListing: (data: Omit<MarketplaceListing, 'id' | 'seller' | 'status' | 'createdAt' | 'createdTimestamp' | 'viewsCount' | 'sharesCount' | 'isSaved'>) => void;
  updateListing: (id: string, updates: Partial<MarketplaceListing>) => void;
  deleteListing: (id: string) => void;
  toggleSaveListing: (id: string) => void;
  markListingStatus: (id: string, status: ListingStatus) => void;
  contactSeller: (listing: MarketplaceListing) => void;
  createListingModalOpen: boolean;
  setCreateListingModalOpen: (open: boolean) => void;
  activeListing: MarketplaceListing | null;
  setActiveListing: (listing: MarketplaceListing | null) => void;
  openUserProfile: (user?: User) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationsCount: number;
  notificationsModalOpen: boolean;
  setNotificationsModalOpen: (open: boolean) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (updater: (prev: UserSettings) => UserSettings) => void;

  // Safety & Moderation
  reportedItems: ReportedItem[];
  reportItem: (targetType: 'post' | 'user' | 'message' | 'listing', targetId: string, reason: string) => void;
  blockedUserIds: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  mutedUserIds: string[];
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;

  // Modals & UI helpers
  createPostModalOpen: boolean;
  setCreatePostModalOpen: (open: boolean) => void;
  createStoryModalOpen: boolean;
  setCreateStoryModalOpen: (open: boolean) => void;
  aiAssistantModalOpen: boolean;
  setAiAssistantModalOpen: (open: boolean) => void;
  moderationModalOpen: boolean;
  setModerationModalOpen: (open: boolean) => void;
  editProfileModalOpen: boolean;
  setEditProfileModalOpen: (open: boolean) => void;
  reportingTarget: { isOpen: boolean; type: 'post' | 'user'; id: string; name?: string } | null;
  setReportingTarget: (target: { isOpen: boolean; type: 'post' | 'user'; id: string; name?: string } | null) => void;

  // Backend Sync & Media
  refreshData: () => Promise<void>;
  isDataLoading: boolean;
  uploadMedia: (dataUrl: string, filename?: string) => Promise<string>;
  resolveModerationReport: (reportId: string, action: 'resolve' | 'dismiss' | 'delete_content') => Promise<void>;

  // SplashScreen
  isSplashScreenActive: boolean;
  setIsSplashScreenActive: (active: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'E91E8C';
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

const adjustColor = (hex: string, factor: number): string => {
  const rgb = hexToRgb(hex);
  const adjusted = rgb.map((val) => {
    if (factor < 0) {
      return Math.round(val * (1 + factor));
    }
    return Math.round(val + (255 - val) * factor);
  });
  return `#${adjusted
    .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
    .join('')}`;
};

const getContrastColor = (hex: string) => {
  const rgb = hexToRgb(hex);
  const normalized = rgb.map((v) => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2];
  return luminance > 0.42 ? '#17131A' : '#FFFFFF';
};

const LEGACY_DEMO_USER_IDS = new Set(['user_clara', 'user_mateo', 'user_sophia', 'user_roseone']);
const LEGACY_DEMO_HANDLES = new Set(['claravane', 'mateochen', 'sophiathorne', 'roseone']);
const isLegacyDemoUser = (user: any) =>
  !!user && (LEGACY_DEMO_USER_IDS.has(user.id) || LEGACY_DEMO_HANDLES.has(String(user.handle || '').toLowerCase()));
const isLegacyDemoPost = (post: any) =>
  !post || String(post.id || '').startsWith('post_launch_') || String(post.id || '').startsWith('post_welcome_') || isLegacyDemoUser(post.author);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [deviceMode, setDeviceMode] = useState<DeviceMode>('auto');
  const [activeTab, setActiveTab] = useState<AndroidTab>('home');
  const [activeView, setActiveView] = useState<'feed' | 'communities' | 'creator-hub' | 'settings' | 'reels' | 'saved' | 'moderation' | 'marketplace' | 'profile'>('feed');
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [isAndroidDrawerOpen, setIsAndroidDrawerOpen] = useState(false);
  const [isSplashScreenActive, setIsSplashScreenActive] = useState(true);

  // Settings stack navigation (Android back-stack support)
  const [activeSettingsSection, setActiveSettingsSection] = useState<AndroidSettingsSection>('overview');
  const [settingsHistory, setSettingsHistory] = useState<AndroidSettingsSection[]>(['overview']);

  const pushSettingsSection = (section: AndroidSettingsSection) => {
    setSettingsHistory((prev) => [...prev, section]);
    setActiveSettingsSection(section);
  };

  const popSettingsSection = () => {
    if (settingsHistory.length > 1) {
      const nextHistory = [...settingsHistory];
      nextHistory.pop();
      setSettingsHistory(nextHistory);
      setActiveSettingsSection(nextHistory[nextHistory.length - 1]);
    } else {
      setActiveView('feed');
      setActiveTab('home');
    }
  };

  // Authentication Modal & State
  const hasValidStoredSession = () => {
    try {
      const token = localStorage.getItem('rose_auth_token');
      const rawUser = localStorage.getItem('rose_current_user');
      const savedUser = rawUser ? JSON.parse(rawUser) : null;
      return !!token && !!savedUser?.id && savedUser.id !== 'guest' && !isLegacyDemoUser(savedUser);
    } catch { return false; }
  };
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => !hasValidStoredSession());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasValidStoredSession());

  // Registered Accounts in the Platform
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('rose_all_users');
      if (!saved) return [];
      const users = JSON.parse(saved);
      return Array.isArray(users) ? users.filter((user) => !isLegacyDemoUser(user)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rose_all_users', JSON.stringify(allUsers));
    } catch (e) {
      console.warn(e);
    }
  }, [allUsers]);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('rose_current_user');
      if (!saved) return DEFAULT_CURRENT_USER;
      const user = JSON.parse(saved);
      return isLegacyDemoUser(user) ? DEFAULT_CURRENT_USER : user;
    } catch {
      return DEFAULT_CURRENT_USER;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rose_current_user', JSON.stringify(currentUser));
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  // Active user profile being viewed in the profile modal
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const login = async (handleOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.login(handleOrEmail, password);
      if (res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        refreshData();
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (
    name: string,
    handle: string,
    email: string,
    password: string,
    bio?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.register({ name, handle, email, password, bio });
      if (res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setAllUsers((prev) => [...prev.filter((u) => u.id !== res.user.id), res.user]);
        refreshData();
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
    setCurrentUser(DEFAULT_CURRENT_USER);
    showToast('Signed out of RoseOne', 'info');
  };

  const switchUser = (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      showToast(`Switched account to @${targetUser.handle}`, 'info');
    }
  };

  const updateCurrentUser = async (updates: Partial<User>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    try {
      await api.updateProfile(currentUser.id, updates);
    } catch (err) {
      console.warn('Could not sync profile to backend:', err);
    }
    showToast('Profile updated successfully', 'success');
  };

  // Posts are loaded from persisted member-created content only
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('rose_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => p && p.id !== 'post_1' && p.id !== 'post_2' && !isLegacyDemoPost(p));
        }
      }
      return INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [comments, setComments] = useState<Record<string, Comment[]>>(() => {
    try {
      const saved = localStorage.getItem('rose_comments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const clean: Record<string, Comment[]> = {};
          for (const [postId, list] of Object.entries(parsed)) {
            if (postId === 'post_1' || postId === 'post_2') continue;
            if (Array.isArray(list)) {
              clean[postId] = list.filter(
                (c: any) => c && !['comm_101', 'comm_102', 'comm_201'].includes(c.id)
              );
            }
          }
          return clean;
        }
      }
      return INITIAL_COMMENTS;
    } catch {
      return INITIAL_COMMENTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rose_posts', JSON.stringify(posts));
    } catch (e) {
      console.warn('Failed saving posts to localStorage', e);
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem('rose_comments', JSON.stringify(comments));
    } catch (e) {
      console.warn('Failed saving comments to localStorage', e);
    }
  }, [comments]);

  // Notifications: Genuine notifications only
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('rose_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((n) => n && !/^notif_[0-9]{1,2}$/.test(n.id));
        }
      }
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rose_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn(e);
    }
  }, [notifications]);

  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Follow / Unfollow Flow
  const toggleFollowUser = (targetUserId: string) => {
    if (targetUserId === currentUser.id) return;

    const targetUser = allUsers.find((u) => u.id === targetUserId);
    const isCurrentlyFollowing = currentUser.following?.includes(targetUserId);
    const isRequested = currentUser.isRequested;

    if (isCurrentlyFollowing) {
      // Unfollow
      const updatedFollowing = (currentUser.following || []).filter((id) => id !== targetUserId);
      const updatedCurrentUser = {
        ...currentUser,
        following: updatedFollowing,
        followingCount: Math.max(0, currentUser.followingCount - 1),
      };
      setCurrentUser(updatedCurrentUser);

      // Update target user's followers
      setAllUsers((prev) =>
        prev.map((u) => {
          if (u.id === targetUserId) {
            const updatedFollowers = (u.followers || []).filter((id) => id !== currentUser.id);
            return {
              ...u,
              followers: updatedFollowers,
              followersCount: Math.max(0, u.followersCount - 1),
              isFollowing: false,
            };
          }
          if (u.id === currentUser.id) {
            return updatedCurrentUser;
          }
          return u;
        })
      );

      // Update posts author state
      setPosts((prev) =>
        prev.map((p) =>
          p.author.id === targetUserId
            ? { ...p, author: { ...p.author, isFollowing: false } }
            : p
        )
      );

      showToast(`Unfollowed @${targetUser?.handle || 'user'}`, 'info');
    } else {
      // Follow or Request to Follow
      if (targetUser?.isPrivate) {
        // Send follow request
        addNotification({
          type: 'follow_request',
          actor: currentUser,
          title: `${currentUser.name} requested to follow you`,
          targetType: 'user',
          targetId: currentUser.id,
          requestId: `req_${Date.now()}`,
        });
        showToast(`Follow request sent to @${targetUser.handle}`, 'success');
      } else {
        // Follow public user
        const updatedFollowing = [...(currentUser.following || []), targetUserId];
        const updatedCurrentUser = {
          ...currentUser,
          following: updatedFollowing,
          followingCount: currentUser.followingCount + 1,
        };
        setCurrentUser(updatedCurrentUser);

        // Update target user
        setAllUsers((prev) =>
          prev.map((u) => {
            if (u.id === targetUserId) {
              const updatedFollowers = [...(u.followers || []), currentUser.id];
              return {
                ...u,
                followers: updatedFollowers,
                followersCount: u.followersCount + 1,
                isFollowing: true,
              };
            }
            if (u.id === currentUser.id) {
              return updatedCurrentUser;
            }
            return u;
          })
        );

        // Update posts author state
        setPosts((prev) =>
          prev.map((p) =>
            p.author.id === targetUserId
              ? { ...p, author: { ...p.author, isFollowing: true } }
              : p
          )
        );

        // Generate genuine notification for target user
        addNotification({
          type: 'follow',
          actor: currentUser,
          title: `${currentUser.name} started following you`,
          targetType: 'user',
          targetId: currentUser.id,
        });

        showToast(`Following @${targetUser?.handle || 'user'}!`, 'success');
      }
    }
  };

  const acceptFollowRequest = (notificationId: string, requesterUserId: string) => {
    const requester = allUsers.find((u) => u.id === requesterUserId);
    if (!requester) return;

    // Add to current user's followers
    const updatedFollowers = [...(currentUser.followers || []), requesterUserId];
    const updatedCurrentUser = {
      ...currentUser,
      followers: updatedFollowers,
      followersCount: currentUser.followersCount + 1,
    };
    setCurrentUser(updatedCurrentUser);

    // Update requester's following
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) return updatedCurrentUser;
        if (u.id === requesterUserId) {
          const uFollowing = [...(u.following || []), currentUser.id];
          return {
            ...u,
            following: uFollowing,
            followingCount: u.followingCount + 1,
          };
        }
        return u;
      })
    );

    // Mark notification handled
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, handled: true } : n
      )
    );

    addNotification({
      type: 'follow',
      actor: currentUser,
      title: `${currentUser.name} accepted your follow request`,
      targetType: 'user',
      targetId: currentUser.id,
    });

    showToast(`Accepted follow request from @${requester.handle}`, 'success');
  };

  const declineFollowRequest = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, handled: true } : n
      )
    );
    showToast('Follow request dismissed', 'info');
  };

  const createPost = (
    content: string,
    media?: string[],
    pollData?: { question: string; options: string[] },
    tags?: string[],
    communityId?: string
  ) => {
    const community = communityId ? communities.find((c) => c.id === communityId) : undefined;
    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: currentUser,
      content,
      media: media && media.length > 0 ? media : undefined,
      poll:
        pollData && pollData.options.length >= 2
          ? {
              id: `poll_${Date.now()}`,
              question: pollData.question || 'Community Poll',
              options: pollData.options.map((opt, i) => ({ id: `opt_${i}`, text: opt, votes: 0 })),
              totalVotes: 0,
            }
          : undefined,
      createdAt: 'Just now',
      createdTimestamp: Date.now(),
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      viewsCount: 1,
      isLiked: false,
      isSaved: false,
      communityId,
      communityName: community?.name,
      tags: tags || [],
    };

    setPosts((prev) => [newPost, ...prev]);

    // Increment current user's genuine post count
    updateCurrentUser({ postsCount: currentUser.postsCount + 1 });
    showToast('Post published to RoseOne!', 'success');
  };

  const [reshareModalPost, setReshareModalPost] = useState<Post | null>(null);

  const reactToPost = (postId: string, reaction: ReactionType) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentReaction = p.reactions?.[currentUser.id];
          const nextReactions = { ...(p.reactions || {}) };
          const nextCounts = { ...(p.reactionCounts || {}) };

          if (currentReaction === reaction) {
            // Toggle off: remove reaction
            delete nextReactions[currentUser.id];
            if (nextCounts[reaction]) {
              nextCounts[reaction] = Math.max(0, (nextCounts[reaction] || 1) - 1);
            }
            const totalLikes = Object.keys(nextReactions).length;
            showToast('Reaction removed', 'info');
            return {
              ...p,
              isLiked: false,
              userReaction: undefined,
              reactions: nextReactions,
              reactionCounts: nextCounts,
              likesCount: totalLikes,
            };
          } else {
            // If had an old reaction, decrement old count
            if (currentReaction && nextCounts[currentReaction]) {
              nextCounts[currentReaction] = Math.max(0, nextCounts[currentReaction] - 1);
            }
            // Add or change to new reaction
            nextReactions[currentUser.id] = reaction;
            nextCounts[reaction] = (nextCounts[reaction] || 0) + 1;
            const totalLikes = Object.keys(nextReactions).length;

            const reactionEmojis: Record<ReactionType, string> = {
              like: '👍',
              love: '❤️',
              fire: '🔥',
              rose: '🌹',
              clap: '👏',
              insight: '💡',
            };

            showToast(`Reacted ${reactionEmojis[reaction]}!`, 'success');

            // Notify post author if not currentUser
            if (p.author.id !== currentUser.id) {
              addNotification({
                type: 'reaction',
                actor: currentUser,
                title: `${currentUser.name} reacted ${reactionEmojis[reaction]} to your post`,
                previewText: p.content.slice(0, 60),
                targetType: 'post',
                targetId: p.id,
              });
            }

            return {
              ...p,
              isLiked: true,
              userReaction: reaction,
              reactions: nextReactions,
              reactionCounts: nextCounts,
              likesCount: totalLikes,
            };
          }
        }
        return p;
      })
    );
  };

  const toggleLikePost = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (target?.isLiked || target?.userReaction) {
      if (target.userReaction) {
        reactToPost(postId, target.userReaction);
      } else {
        reactToPost(postId, 'rose');
      }
    } else {
      reactToPost(postId, 'rose');
    }
  };

  const toggleSavePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isSaved = !p.isSaved;
          showToast(isSaved ? 'Saved to collections' : 'Removed from collections', 'info');
          return { ...p, isSaved };
        }
        return p;
      })
    );
  };

  const toggleRepostPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isReposted = !p.isReposted;
          showToast(isReposted ? 'Reposted to your followers' : 'Repost undone', 'info');

          if (isReposted && p.author.id !== currentUser.id) {
            addNotification({
              type: 'reaction',
              actor: currentUser,
              title: `${currentUser.name} reposted your post`,
              previewText: p.content.slice(0, 60),
              targetType: 'post',
              targetId: p.id,
            });
          }

          return {
            ...p,
            isReposted,
            repostsCount: isReposted ? p.repostsCount + 1 : Math.max(0, p.repostsCount - 1),
          };
        }
        return p;
      })
    );
  };

  const resharePostWithQuote = (originalPostId: string, quoteCaption?: string) => {
    const orig = posts.find((p) => p.id === originalPostId);
    if (!orig) return;

    // Increment original post's repostsCount and mark reposted
    setPosts((prev) =>
      prev.map((p) =>
        p.id === originalPostId
          ? { ...p, repostsCount: p.repostsCount + 1, isReposted: true }
          : p
      )
    );

    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: currentUser,
      content: quoteCaption || '',
      resharedPost: orig,
      createdAt: 'Just now',
      createdTimestamp: Date.now(),
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      viewsCount: 1,
      isLiked: false,
      isSaved: false,
      isReposted: false,
      tags: orig.tags || [],
    };

    setPosts((prev) => [newPost, ...prev]);
    updateCurrentUser({ postsCount: currentUser.postsCount + 1 });

    if (orig.author.id !== currentUser.id) {
      addNotification({
        type: 'reaction',
        actor: currentUser,
        title: `${currentUser.name} reshared your post`,
        previewText: quoteCaption ? quoteCaption.slice(0, 60) : orig.content.slice(0, 60),
        targetType: 'post',
        targetId: orig.id,
      });
    }

    showToast('Post reshared to your followers!', 'success');
  };

  const votePoll = (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId && p.poll && !p.poll.userVotedId) {
          const updatedOptions = p.poll.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          );
          return {
            ...p,
            poll: {
              ...p.poll,
              options: updatedOptions,
              userVotedId: optionId,
              totalVotes: p.poll.totalVotes + 1,
            },
          };
        }
        return p;
      })
    );
    showToast('Vote recorded!', 'success');
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    updateCurrentUser({ postsCount: Math.max(0, currentUser.postsCount - 1) });
    showToast('Post deleted', 'info');
  };

  const addComment = (postId: string, content: string, replyToCommentId?: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      postId,
      author: currentUser,
      content,
      createdAt: 'Just now',
      createdTimestamp: Date.now(),
      likesCount: 0,
      isLiked: false,
    };

    setComments((prev) => {
      const postComments = prev[postId] || [];
      if (replyToCommentId) {
        return {
          ...prev,
          [postId]: postComments.map((c) => {
            if (c.id === replyToCommentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          }),
        };
      }
      return {
        ...prev,
        [postId]: [newComment, ...postComments],
      };
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );

    // If commenting on someone else's post, create notification
    if (targetPost && targetPost.author.id !== currentUser.id) {
      addNotification({
        type: 'comment',
        actor: currentUser,
        title: `${currentUser.name} commented on your post`,
        previewText: content.slice(0, 60),
        targetType: 'post',
        targetId: postId,
      });
    }

    showToast('Comment posted', 'success');
  };

  const addVoiceComment = (
    postId: string,
    voiceUrl: string,
    voiceDuration: number,
    textCaption?: string,
    replyToCommentId?: string
  ) => {
    const targetPost = posts.find((p) => p.id === postId);
    const duration = Math.min(120, Math.max(1, Math.round(voiceDuration)));
    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      postId,
      author: currentUser,
      content: textCaption || '🎙️ Voice Note',
      voiceUrl,
      voiceDuration: duration,
      createdAt: 'Just now',
      createdTimestamp: Date.now(),
      likesCount: 0,
      isLiked: false,
    };

    setComments((prev) => {
      const postComments = prev[postId] || [];
      if (replyToCommentId) {
        return {
          ...prev,
          [postId]: postComments.map((c) => {
            if (c.id === replyToCommentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          }),
        };
      }
      return {
        ...prev,
        [postId]: [newComment, ...postComments],
      };
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );

    if (targetPost && targetPost.author.id !== currentUser.id) {
      addNotification({
        type: 'comment',
        actor: currentUser,
        title: `${currentUser.name} left a voice comment on your post`,
        previewText: `🎙️ Voice note (${duration}s)`,
        targetType: 'post',
        targetId: postId,
      });
    }

    showToast(`Voice comment posted (${duration}s)!`, 'success');
  };

  const deleteComment = (
    postId: string,
    commentId: string,
    isReply?: boolean,
    parentCommentId?: string
  ) => {
    setComments((prev) => {
      const postComments = prev[postId] || [];
      if (isReply && parentCommentId) {
        return {
          ...prev,
          [postId]: postComments.map((c) => {
            if (c.id === parentCommentId && c.replies) {
              return {
                ...c,
                replies: c.replies.filter((r) => r.id !== commentId),
              };
            }
            return c;
          }),
        };
      }
      return {
        ...prev,
        [postId]: postComments.filter((c) => c.id !== commentId),
      };
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p))
    );

    showToast('Comment deleted', 'info');
  };

  const toggleLikeComment = (postId: string, commentId: string) => {
    setComments((prev) => {
      const postComments = prev[postId] || [];
      return {
        ...prev,
        [postId]: postComments.map((c) => {
          if (c.id === commentId) {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId
                  ? {
                      ...r,
                      isLiked: !r.isLiked,
                      likesCount: !r.isLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
                    }
                  : r
              ),
            };
          }
          return c;
        }),
      };
    });
  };

  // Stories with 24-hour expiry lifecycle (preserving real user uploaded stories)
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('rose_stories');
      if (saved) {
        const parsed: Story[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          const clean = parsed.filter(
            (s) =>
              s &&
              s.id !== 'story_1' &&
              s.id !== 'story_2' &&
              s.id !== 'story_3' &&
              !LEGACY_DEMO_USER_IDS.has(s.userId) &&
              !String(s.id || '').startsWith('story_clara_') &&
              !String(s.id || '').startsWith('story_mateo_') &&
              now - s.createdTimestamp < (s.expiresInHours || 24) * 3600 * 1000
          );
          return clean;
        }
      }
      return INITIAL_STORIES;
    } catch {
      return INITIAL_STORIES;
    }
  });

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('rose_stories', JSON.stringify(stories));
    } catch (e) {
      console.warn(e);
    }
  }, [stories]);

  const createStory = (
    mediaType: 'photo' | 'video' | 'text',
    mediaUrl: string,
    caption?: string,
    textContent?: string,
    bgColor?: string,
    audience: 'everyone' | 'followers' | 'close-friends' = 'everyone',
    storyThumbnail?: string
  ) => {
    const newStory: Story = {
      id: `story_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userHandle: currentUser.handle,
      userAvatar: currentUser.avatar,
      storyThumbnail: storyThumbnail || (mediaType === 'photo' ? mediaUrl : currentUser.avatar),
      mediaType,
      mediaUrl,
      caption,
      textContent,
      bgColor: bgColor || 'bg-gradient-to-tr from-[#BE185D] to-[#E91E8C]',
      createdAt: 'Just now',
      createdTimestamp: Date.now(),
      expiresInHours: 24,
      audience,
      viewers: [],
      reactions: [],
      comments: [],
      isViewed: false,
    };
    setStories((prev) => [newStory, ...prev]);
    showToast('Story published for 24 hours!', 'success');
  };

  const markStoryViewed = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          const hasViewed = s.viewers?.some((v) => v.userId === currentUser.id);
          const nextViewers = hasViewed
            ? s.viewers
            : [
                ...(s.viewers || []),
                {
                  userId: currentUser.id,
                  userName: currentUser.name,
                  userHandle: currentUser.handle,
                  userAvatar: currentUser.avatar,
                  viewedAt: 'Just now',
                },
              ];
          return { ...s, isViewed: true, viewers: nextViewers };
        }
        return s;
      })
    );
  };

  const reactToStory = (storyId: string, emoji: string) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          const updatedReactions = [
            ...(s.reactions || []),
            {
              userId: currentUser.id,
              userName: currentUser.name,
              userAvatar: currentUser.avatar,
              emoji,
              timestamp: 'Just now',
            },
          ];

          // Notify story owner if not me
          if (s.userId !== currentUser.id) {
            addNotification({
              type: 'story_reaction',
              actor: currentUser,
              title: `${currentUser.name} reacted ${emoji} to your story`,
              targetType: 'story',
              targetId: storyId,
            });
          }

          return { ...s, reactions: updatedReactions };
        }
        return s;
      })
    );
    showToast(`Reacted ${emoji} to story!`, 'success');
  };

  const addStoryComment = (
    storyId: string,
    text?: string,
    voiceUrl?: string,
    voiceDuration?: number
  ) => {
    const targetStory = stories.find((s) => s.id === storyId);
    const newComment: StoryComment = {
      id: `scomm_${Date.now()}`,
      storyId,
      author: currentUser,
      text,
      voiceUrl,
      voiceDuration: voiceDuration ? Math.min(120, Math.round(voiceDuration)) : undefined,
      createdAt: 'Just now',
      createdTimestamp: Date.now(),
    };

    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          return {
            ...s,
            comments: [...(s.comments || []), newComment],
          };
        }
        return s;
      })
    );

    if (targetStory && targetStory.userId !== currentUser.id) {
      addNotification({
        type: 'comment',
        actor: currentUser,
        title: `${currentUser.name} commented on your story`,
        previewText: text || '🎙️ Voice note',
        targetType: 'story',
        targetId: storyId,
      });
    }

    showToast('Comment sent on story!', 'success');
  };

  const deleteStory = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    setActiveStoryIndex(null);
    showToast('Story deleted', 'info');
  };

  // Messaging: Genuine user conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('rose_conversations');
      if (!saved) return INITIAL_CONVERSATIONS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((conversation) => conversation?.id !== 'conv_clara_mateo' && !(conversation?.participants || []).some((participant: any) => isLegacyDemoUser(participant))) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('rose_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn(e);
    }
  }, [conversations]);

  const startNewConversation = (recipientName: string, recipientHandle: string, initialMessage?: string) => {
    const cleanHandle = recipientHandle.replace(/^@/, '').trim();
    const existing = conversations.find(
      (c) => !c.isGroup && c.participants.some((p) => p.handle === cleanHandle)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      setActiveView('feed');
      setActiveTab('messages');
      if (initialMessage) {
        sendMessage(existing.id, initialMessage);
      }
      return;
    }

    const recipientUser: User = allUsers.find((u) => u.handle === cleanHandle) || {
      id: `user_${cleanHandle}`,
      name: recipientName.trim() || cleanHandle,
      handle: cleanHandle,
      avatar: '',
      banner: '',
      bio: '',
      joinedDate: 'RoseOne member',
      verified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    };

    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title: recipientUser.name,
      isGroup: false,
      avatar: recipientUser.avatar,
      participants: [currentUser, recipientUser],
      messages: initialMessage
        ? [
            {
              id: `msg_${Date.now()}`,
              senderId: currentUser.id,
              text: initialMessage,
              createdAt: 'Just now',
              isRead: true,
            },
          ]
        : [],
      unreadCount: 0,
      lastMessageTime: 'Just now',
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setActiveView('feed');
    setActiveTab('messages');
    showToast(`Conversation opened with @${cleanHandle}`, 'success');
  };

  const sendMessage = (
    conversationId: string,
    text: string,
    mediaUrl?: string,
    audioDuration?: number
  ) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      text,
      mediaUrl,
      audioDuration,
      createdAt: 'Just now',
      isRead: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessageTime: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  };

  const togglePinMessage = (conversationId: string, messageId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          const target = c.messages.find((m) => m.id === messageId);
          const isCurrentlyPinned = c.pinnedMessage?.id === messageId;
          return {
            ...c,
            pinnedMessage: isCurrentlyPinned ? undefined : target,
          };
        }
        return c;
      })
    );
    showToast('Message pin status updated', 'info');
  };

  const reactToMessage = (conversationId: string, messageId: string, emoji: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
                : m
            ),
          };
        }
        return c;
      })
    );
  };

  // Communities: Genuine communities
  const [communities, setCommunities] = useState<Community[]>(() => {
    try {
      const saved = localStorage.getItem('rose_communities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy seeded communities while preserving member-created groups
          const clean = parsed.filter((c) => c && c.id !== 'comm_1' && c.id !== 'comm_2' && c.id !== 'comm_creators');
          return clean;
        }
      }
      return INITIAL_COMMUNITIES;
    } catch {
      return INITIAL_COMMUNITIES;
    }
  });

  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [createCommunityInitialType, setCreateCommunityInitialType] = useState<'community' | 'group'>('community');
  const [communityDashboardTab, setCommunityDashboardTab] = useState<'feed' | 'about' | 'members' | 'events' | 'announcements' | 'settings'>('feed');

  const openCreateCommunity = (type: 'community' | 'group' = 'community') => {
    setCreateCommunityInitialType(type);
    setIsCreateCommunityOpen(true);
  };

  useEffect(() => {
    try {
      localStorage.setItem('rose_communities', JSON.stringify(communities));
    } catch (e) {
      console.warn(e);
    }
  }, [communities]);

  const createCommunity = (name: string, description: string, isPrivate: boolean) => {
    createCommunityDetailed({
      name,
      description,
      isPrivate,
      type: 'community',
    });
  };

  const createCommunityDetailed = (data: Partial<Community> & { name: string; description: string }): Community => {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newComm: Community = {
      id: `comm_${Date.now()}`,
      type: data.type || 'community',
      name: data.name.trim(),
      slug: slug || 'community',
      description: data.description.trim(),
      avatar: data.avatar || '',
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
      category: data.category || 'Technology',
      badge: data.badge || (data.type === 'group' ? 'Member Group' : 'Public Space'),
      membersCount: 1,
      isJoined: true,
      isPrivate: !!data.isPrivate,
      discoverability: data.discoverability || 'visible',
      whoCanJoin: data.whoCanJoin || (data.isPrivate ? 'approval_required' : 'anyone'),
      inviteLink: data.inviteLink || `https://roseone.net/c/${slug}?inv=${Math.random().toString(36).substring(2, 8)}`,
      requireAdminApprovalForJoin: data.requireAdminApprovalForJoin ?? !!data.isPrivate,
      ownerId: currentUser.id,
      owner: currentUser,
      admins: [currentUser],
      moderators: data.moderators || [],
      memberList: [
        { user: currentUser, role: 'owner', joinedDate: 'Just now' },
      ],
      memberPermissions: data.memberPermissions || {
        canPost: true,
        canCreatePolls: true,
        canUploadMedia: true,
        canInviteOthers: true,
      },
      postingApproval: data.postingApproval || 'instant',
      membershipQuestions: data.membershipQuestions || [],
      rules: data.rules && data.rules.length > 0 ? data.rules : [
        {
          id: `r_${Date.now()}_1`,
          title: 'Be Respectful & Kind',
          description: 'Treat everyone with respect and foster welcoming, productive dialogue.',
        },
        {
          id: `r_${Date.now()}_2`,
          title: 'No Spam or Unsolicited Links',
          description: 'Keep discussions authentic and relevant to the space topic.',
        },
      ],
      spamPrevention: data.spamPrevention || {
        autoFilterSpam: true,
        blockExternalLinks: false,
        minAccountAgeDays: 0,
      },
      pendingMembers: [],
      moderationLog: [
        {
          id: `mod_${Date.now()}`,
          action: 'Created Space',
          actor: currentUser.name,
          timestamp: 'Just now',
          details: `Created new ${data.type || 'community'} "${data.name}"`,
        },
      ],
      channels: data.channels && data.channels.length > 0 ? data.channels : ['general', 'announcements'],
      activeChannel: data.channels && data.channels.length > 0 ? data.channels[0] : 'general',
      topics: data.topics || [],
      pinnedPostIds: [],
      announcements: data.announcements || [],
      events: data.events || [],
      aiAssistant: data.aiAssistant || {
        enabled: false,
        explicitAdminApproved: false,
        botName: 'RoseBot',
        personality: 'welcoming',
        autoSummaries: false,
        autoWelcomeNewMembers: false,
        answerQuestionsWithDocs: false,
      },
      notificationsSettings: data.notificationsSettings || {
        notifyOnNewPost: true,
        notifyOnMemberJoin: false,
        emailDigest: 'weekly',
      },
      chatPermissions: data.chatPermissions || 'members',
      allowMemberInvites: data.allowMemberInvites ?? true,
      createdAt: 'Just now',
    };

    setCommunities((prev) => [newComm, ...prev]);
    setActiveCommunityId(newComm.id);
    setActiveView('communities');
    setCommunityDashboardTab('feed');
    setIsCreateCommunityOpen(false);
    showToast(`Created ${data.type === 'group' ? 'Group' : 'Community'} "${newComm.name}"!`, 'success');
    return newComm;
  };

  const updateCommunity = (communityId: string, updates: Partial<Community>) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, ...updates } : c))
    );
    showToast('Community settings updated!', 'success');
  };

  const deleteCommunity = (communityId: string) => {
    const target = communities.find((c) => c.id === communityId);
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
    if (activeCommunityId === communityId) {
      setActiveCommunityId(null);
    }
    showToast(`Deleted ${target?.name || 'community'}`, 'info');
  };

  const joinCommunity = (communityId: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? {
              ...c,
              isJoined: true,
              membersCount: c.membersCount + 1,
              memberList: [
                ...(c.memberList || []),
                { user: currentUser, role: 'member' as const, joinedDate: 'Just now' },
              ],
            }
          : c
      )
    );
    showToast('Joined space!', 'success');
  };

  const leaveCommunity = (communityId: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? {
              ...c,
              isJoined: false,
              membersCount: Math.max(0, c.membersCount - 1),
              memberList: (c.memberList || []).filter((m) => m.user.id !== currentUser.id),
            }
          : c
      )
    );
    showToast('Left space', 'info');
  };

  const switchCommunityChannel = (communityId: string, channelName: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId ? { ...c, activeChannel: channelName } : c
      )
    );
  };

  const approvePendingMember = (communityId: string, applicantId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        const applicant = c.pendingMembers?.find((m) => m.user.id === applicantId);
        if (!applicant) return c;
        const remainingPending = c.pendingMembers?.filter((m) => m.user.id !== applicantId) || [];
        const newMemberList = [
          ...(c.memberList || []),
          { user: applicant.user, role: 'member' as const, joinedDate: 'Just now' },
        ];
        const newLog = [
          {
            id: `mod_${Date.now()}`,
            action: 'Approved Member',
            actor: currentUser.name,
            timestamp: 'Just now',
            details: `Approved @${applicant.user.handle} to join`,
          },
          ...(c.moderationLog || []),
        ];
        return {
          ...c,
          pendingMembers: remainingPending,
          memberList: newMemberList,
          membersCount: c.membersCount + 1,
          moderationLog: newLog,
        };
      })
    );
    showToast('Member approved and welcomed to space!', 'success');
  };

  const rejectPendingMember = (communityId: string, applicantId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        const applicant = c.pendingMembers?.find((m) => m.user.id === applicantId);
        const remainingPending = c.pendingMembers?.filter((m) => m.user.id !== applicantId) || [];
        const newLog = [
          {
            id: `mod_${Date.now()}`,
            action: 'Declined Request',
            actor: currentUser.name,
            timestamp: 'Just now',
            details: `Declined join request from @${applicant?.user.handle || applicantId}`,
          },
          ...(c.moderationLog || []),
        ];
        return {
          ...c,
          pendingMembers: remainingPending,
          moderationLog: newLog,
        };
      })
    );
    showToast('Membership request declined', 'info');
  };

  const addCommunityAnnouncement = (communityId: string, title: string, content: string) => {
    const newAnn: CommunityAnnouncement = {
      id: `ann_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      createdAt: 'Just now',
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      isPinned: true,
    };
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? { ...c, announcements: [newAnn, ...(c.announcements || [])] }
          : c
      )
    );
    showToast('Announcement pinned & published!', 'success');
  };

  const deleteCommunityAnnouncement = (communityId: string, announcementId: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? {
              ...c,
              announcements: (c.announcements || []).filter((a) => a.id !== announcementId),
            }
          : c
      )
    );
    showToast('Announcement removed', 'info');
  };

  const addCommunityEvent = (
    communityId: string,
    eventData: { title: string; description?: string; date: string; time: string; location: string }
  ) => {
    const newEvt: CommunityEvent = {
      id: `evt_${Date.now()}`,
      title: eventData.title.trim(),
      description: eventData.description?.trim(),
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      attendeesCount: 1,
      isAttending: true,
    };
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? { ...c, events: [newEvt, ...(c.events || [])] }
          : c
      )
    );
    showToast('Event created and scheduled!', 'success');
  };

  const toggleCommunityEventRsvp = (communityId: string, eventId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        return {
          ...c,
          events: (c.events || []).map((e) => {
            if (e.id === eventId) {
              const isAttending = !e.isAttending;
              return {
                ...e,
                isAttending,
                attendeesCount: isAttending ? e.attendeesCount + 1 : Math.max(1, e.attendeesCount - 1),
              };
            }
            return e;
          }),
        };
      })
    );
    showToast('RSVP updated!', 'info');
  };

  const togglePinPostInCommunity = (communityId: string, postId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        const pinned = c.pinnedPostIds || [];
        const isPinned = pinned.includes(postId);
        return {
          ...c,
          pinnedPostIds: isPinned ? pinned.filter((id) => id !== postId) : [postId, ...pinned],
        };
      })
    );
    showToast('Post pin status updated in community', 'info');
  };

  const addCommunityChannel = (communityId: string, channelName: string) => {
    const clean = channelName.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
    if (!clean) return;
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        if (c.channels.includes(clean)) return c;
        return { ...c, channels: [...c.channels, clean] };
      })
    );
    showToast(`Added channel #${clean}`, 'success');
  };

  const deleteCommunityChannel = (communityId: string, channelName: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        if (c.channels.length <= 1) {
          showToast('Cannot delete the last remaining channel', 'error');
          return c;
        }
        const updatedChannels = c.channels.filter((ch) => ch !== channelName);
        const newActive = c.activeChannel === channelName ? updatedChannels[0] : c.activeChannel;
        return { ...c, channels: updatedChannels, activeChannel: newActive };
      })
    );
    showToast(`Deleted channel #${channelName}`, 'info');
  };

  const addCommunityRule = (communityId: string, title: string, description: string) => {
    const newRule: CommunityRule = {
      id: `r_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
    };
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        return { ...c, rules: [...c.rules, newRule] };
      })
    );
    showToast('New community rule added!', 'success');
  };

  const deleteCommunityRule = (communityId: string, ruleId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        return {
          ...c,
          rules: c.rules.filter((r) => {
            if (typeof r === 'string') return true;
            return r.id !== ruleId;
          }),
        };
      })
    );
    showToast('Rule removed', 'info');
  };

  const assignMemberRole = (communityId: string, userId: string, role: 'admin' | 'moderator' | 'member') => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        const memberList = (c.memberList || []).map((m) =>
          m.user.id === userId ? { ...m, role } : m
        );
        const targetUser = memberList.find((m) => m.user.id === userId)?.user || allUsers.find((u) => u.id === userId);
        const newAdmins = role === 'admin'
          ? [...(c.admins || []).filter((u) => u.id !== userId), ...(targetUser ? [targetUser] : [])]
          : (c.admins || []).filter((u) => u.id !== userId);
        const newMods = role === 'moderator'
          ? [...(c.moderators || []).filter((u) => u.id !== userId), ...(targetUser ? [targetUser] : [])]
          : (c.moderators || []).filter((u) => u.id !== userId);

        return {
          ...c,
          memberList,
          admins: newAdmins,
          moderators: newMods,
        };
      })
    );
    showToast(`Updated member role to ${role}`, 'success');
  };

  const removeMemberFromCommunity = (communityId: string, userId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== communityId) return c;
        return {
          ...c,
          memberList: (c.memberList || []).filter((m) => m.user.id !== userId),
          admins: (c.admins || []).filter((u) => u.id !== userId),
          moderators: (c.moderators || []).filter((u) => u.id !== userId),
          membersCount: Math.max(1, c.membersCount - 1),
        };
      })
    );
    showToast('Member removed from space', 'info');
  };

  // Creator & Business Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('rose_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rose_products', JSON.stringify(products));
    } catch (e) {
      console.warn(e);
    }
  }, [products]);

  const addProduct = (prod: Omit<Product, 'id' | 'salesCount' | 'rating'>) => {
    const newProd: Product = {
      ...prod,
      id: `prod_${Date.now()}`,
      salesCount: 0,
      rating: 5.0,
    };
    setProducts((prev) => [newProd, ...prev]);
    showToast('Product added to your RoseOne Store!', 'success');
  };

  // Marketplace listings are member-created; remove any legacy sample records
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>(() => {
    try {
      const saved = localStorage.getItem('rose_marketplace_listings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((l) => l && !/^list_[0-9]{1,2}$/.test(l.id));
        }
      }
      return INITIAL_MARKETPLACE_LISTINGS;
    } catch {
      return INITIAL_MARKETPLACE_LISTINGS;
    }
  });

  // Remove the previous built-in showcase accounts and their seeded content from this browser.
  useEffect(() => {
    try {
      const legacyKeys = [
        'aura_posts', 'aura_current_user', 'aura_comments', 'aura_stories',
        'aura_conversations', 'aura_communities', 'aura_products', 'aura_settings',
      ];
      legacyKeys.forEach((key) => localStorage.removeItem(key));

      const savedUser = localStorage.getItem('rose_current_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (isLegacyDemoUser(user) || user?.id === 'guest') {
          localStorage.removeItem('rose_current_user');
          localStorage.removeItem('rose_auth_token');
          setCurrentUser(DEFAULT_CURRENT_USER);
          setIsAuthenticated(false);
          setIsAuthModalOpen(true);
        }
      }

      const savedUsers = localStorage.getItem('rose_all_users');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        if (Array.isArray(users)) {
          const cleanUsers = users.filter((user) => !isLegacyDemoUser(user));
          setAllUsers(cleanUsers);
          localStorage.setItem('rose_all_users', JSON.stringify(cleanUsers));
        }
      }

      const savedPosts = localStorage.getItem('rose_posts');
      if (savedPosts) {
        const posts = JSON.parse(savedPosts);
        if (Array.isArray(posts)) {
          const cleanPosts = posts.filter((post) => !isLegacyDemoPost(post));
          setPosts(cleanPosts);
          localStorage.setItem('rose_posts', JSON.stringify(cleanPosts));
        }
      }

      const savedComments = localStorage.getItem('rose_comments');
      if (savedComments) {
        const comments = JSON.parse(savedComments);
        if (comments && typeof comments === 'object' && !Array.isArray(comments)) {
          const validPostIds = new Set((JSON.parse(localStorage.getItem('rose_posts') || '[]') as any[]).map((post) => post.id));
          const cleanComments = Object.fromEntries(Object.entries(comments).filter(([postId]) => validPostIds.has(postId)));
          setComments(cleanComments as Record<string, Comment[]>);
          localStorage.setItem('rose_comments', JSON.stringify(cleanComments));
        }
      }

      const savedNotifications = localStorage.getItem('rose_notifications');
      if (savedNotifications) {
        const notifications = JSON.parse(savedNotifications);
        if (Array.isArray(notifications)) {
          const cleanNotifications = notifications.filter((item) => !isLegacyDemoUser(item?.actor));
          setNotifications(cleanNotifications);
          localStorage.setItem('rose_notifications', JSON.stringify(cleanNotifications));
        }
      }

      const savedProducts = localStorage.getItem('rose_products');
      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        if (Array.isArray(products)) {
          const cleanProducts = products.filter((item) => item && !/^prod_[0-9]{1,2}$/.test(item.id));
          setProducts(cleanProducts);
          localStorage.setItem('rose_products', JSON.stringify(cleanProducts));
        }
      }

      const savedListings = localStorage.getItem('rose_marketplace_listings');
      if (savedListings) {
        const listings = JSON.parse(savedListings);
        if (Array.isArray(listings)) {
          const cleanListings = listings.filter((item) => item && !/^list_[0-9]{1,2}$/.test(item.id) && !isLegacyDemoUser(item.seller));
          setMarketplaceListings(cleanListings);
          localStorage.setItem('rose_marketplace_listings', JSON.stringify(cleanListings));
        }
      }

      const savedStories = localStorage.getItem('rose_stories');
      if (savedStories) {
        const stories = JSON.parse(savedStories);
        if (Array.isArray(stories)) {
          const cleanStories = stories.filter((story) =>
            story && !LEGACY_DEMO_USER_IDS.has(story.userId) &&
            !String(story.id || '').startsWith('story_clara_') &&
            !String(story.id || '').startsWith('story_mateo_')
          );
          setStories(cleanStories);
          localStorage.setItem('rose_stories', JSON.stringify(cleanStories));
        }
      }

      const savedConversations = localStorage.getItem('rose_conversations');
      if (savedConversations) {
        const conversations = JSON.parse(savedConversations);
        if (Array.isArray(conversations)) {
          const cleanConversations = conversations.filter((conversation) =>
            conversation?.id !== 'conv_clara_mateo' &&
            !(conversation?.participants || []).some((participant: any) => isLegacyDemoUser(participant))
          );
          setConversations(cleanConversations);
          localStorage.setItem('rose_conversations', JSON.stringify(cleanConversations));
        }
      }

      const savedCommunities = localStorage.getItem('rose_communities');
      if (savedCommunities) {
        const communities = JSON.parse(savedCommunities);
        if (Array.isArray(communities)) {
          const cleanCommunities = communities.filter((community) => community?.id !== 'comm_creators');
          setCommunities(cleanCommunities);
          localStorage.setItem('rose_communities', JSON.stringify(cleanCommunities));
        }
      }
    } catch (error) {
      console.warn('RoseOne legacy-data cleanup could not complete:', error);
    }
  }, []);


  const [activeListing, setActiveListing] = useState<MarketplaceListing | null>(null);
  const [createListingModalOpen, setCreateListingModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('rose_marketplace_listings', JSON.stringify(marketplaceListings));
    } catch (e) {
      console.warn(e);
    }
  }, [marketplaceListings]);

  const createListing = (
    data: Omit<MarketplaceListing, 'id' | 'seller' | 'status' | 'createdAt' | 'createdTimestamp' | 'viewsCount' | 'sharesCount' | 'isSaved'>
  ) => {
    const newListing: MarketplaceListing = {
      ...data,
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      seller: currentUser,
      status: 'available',
      createdAt: 'Just now',
      createdTimestamp: Date.now(),
      viewsCount: 1,
      sharesCount: 0,
      isSaved: false,
    };
    setMarketplaceListings((prev) => [newListing, ...prev]);
    showToast('Listing published to Rose Marketplace!', 'success');
  };

  const updateListing = (id: string, updates: Partial<MarketplaceListing>) => {
    setMarketplaceListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    if (activeListing && activeListing.id === id) {
      setActiveListing((prev) => (prev ? { ...prev, ...updates } : null));
    }
    showToast('Listing updated', 'success');
  };

  const deleteListing = (id: string) => {
    setMarketplaceListings((prev) => prev.filter((l) => l.id !== id));
    if (activeListing && activeListing.id === id) {
      setActiveListing(null);
    }
    showToast('Listing deleted', 'info');
  };

  const toggleSaveListing = (id: string) => {
    setMarketplaceListings((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const isSaved = !l.isSaved;
          showToast(isSaved ? 'Listing saved to favorites' : 'Removed from favorites', 'info');
          return { ...l, isSaved };
        }
        return l;
      })
    );
    if (activeListing && activeListing.id === id) {
      setActiveListing((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : null));
    }
  };

  const markListingStatus = (id: string, status: ListingStatus) => {
    setMarketplaceListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    if (activeListing && activeListing.id === id) {
      setActiveListing((prev) => (prev ? { ...prev, status } : null));
    }
    showToast(`Listing marked as ${status}`, 'success');
  };

  const contactSeller = (listing: MarketplaceListing) => {
    if (listing.seller.id === currentUser.id) {
      showToast('You are the seller of this listing', 'info');
      return;
    }
    startNewConversation(
      listing.seller.name,
      listing.seller.handle,
      `Hi @${listing.seller.handle}! I am interested in your listing: "${listing.title}" ($${listing.price}). Is this item still available?`
    );
    showToast(`Conversation started with @${listing.seller.handle}`, 'success');
  };

  const openUserProfile = (user?: User) => {
    if (!user || user.id === currentUser.id) {
      setActiveView('profile');
      setViewingUser(null);
    } else {
      setViewingUser(user);
    }
  };

  // Real Calculated Creator Analytics based on genuine user activity
  const totalUserPostViews = posts
    .filter((p) => p?.author?.id === currentUser.id)
    .reduce((acc, p) => acc + (p?.viewsCount || 0), 0);

  const totalUserReactions = posts
    .filter((p) => p?.author?.id === currentUser.id)
    .reduce((acc, p) => acc + (p?.likesCount || 0) + (p?.commentsCount || 0) + (p?.repostsCount || 0), 0);

  const engagementRateCalc =
    totalUserPostViews > 0
      ? Number(((totalUserReactions / totalUserPostViews) * 100).toFixed(1))
      : 0;

  const userRealPostsCount = posts.filter((p) => p?.author?.id === currentUser.id).length;

  const analytics: CreatorAnalytics = {
    impressions30d: totalUserPostViews,
    impressionsGrowth: totalUserPostViews > 0 ? 100 : 0,
    reach30d: totalUserPostViews,
    reachGrowth: totalUserPostViews > 0 ? 100 : 0,
    profileVisits30d: userRealPostsCount * 4,
    engagementRate: engagementRateCalc,
    followersGrowthHistory: [
      { day: 'Day 1', count: 0 },
      { day: 'Day 5', count: 0 },
      { day: 'Day 10', count: 0 },
      { day: 'Day 15', count: 0 },
      { day: 'Day 20', count: 0 },
      { day: 'Day 25', count: 0 },
      { day: 'Day 30', count: currentUser.followersCount || 0 },
    ],
    topPostImpressions: posts.length > 0 ? Math.max(0, ...posts.map((p) => p?.viewsCount || 0)) : 0,
  };

  // Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('rose_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const updateSettings = (updater: (prev: UserSettings) => UserSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('rose_settings', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    showToast('Settings saved', 'success');
  };

  // Apply the user's appearance preferences globally. This client build persists locally;
  // an authenticated backend can replace this storage layer without changing the UI.
  useEffect(() => {
    const root = document.documentElement;
    const applyAppearance = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark =
        settings.appearance.theme === 'dark' ||
        (settings.appearance.theme === 'system' && prefersDark);
      root.classList.toggle('dark', isDark);

      const accent = settings.appearance.accentColor || '#E91E8C';
      const rgb = hexToRgb(accent);
      root.style.setProperty('--brand-pink', accent);
      root.style.setProperty('--brand-accent', accent);
      root.style.setProperty('--brand-accent-dark', adjustColor(accent, -0.25));
      root.style.setProperty('--brand-accent-darker', adjustColor(accent, -0.4));
      root.style.setProperty('--brand-accent-light', adjustColor(accent, 0.3));
      root.style.setProperty('--brand-accent-pastel', adjustColor(accent, 0.75));
      root.style.setProperty('--brand-accent-contrast', getContrastColor(accent));
      root.style.setProperty('--brand-accent-rgb', `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
      root.style.setProperty('--brand-accent-soft', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.16)`);
      root.style.setProperty('--brand-accent-subtle', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.08)`);
      root.style.setProperty('--brand-accent-ring', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.35)`);

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', accent);
      const metaTile = document.querySelector('meta[name="msapplication-TileColor"]');
      if (metaTile) metaTile.setAttribute('content', accent);
    };
    applyAppearance();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (settings.appearance.theme === 'system') applyAppearance();
    };
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [settings.appearance.theme, settings.appearance.accentColor]);

  // Safety & Moderation
  const [reportedItems, setReportedItems] = useState<ReportedItem[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);

  const reportItem = (targetType: 'post' | 'user' | 'message' | 'listing', targetId: string, reason: string) => {
    const newReport: ReportedItem = {
      id: `rep_${Date.now()}`,
      targetType,
      targetId,
      reason,
      reporterHandle: currentUser.handle,
      timestamp: 'Just now',
      status: 'pending',
    };
    setReportedItems((prev) => [newReport, ...prev]);
    showToast('Thank you. Report submitted to RoseOne safety team.', 'info');
  };

  const blockUser = (userId: string) => {
    setBlockedUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    showToast('User blocked. You will no longer see their content or messages.', 'info');
  };

  const unblockUser = (userId: string) => {
    setBlockedUserIds((prev) => prev.filter((id) => id !== userId));
    showToast('User unblocked', 'info');
  };

  const muteUser = (userId: string) => {
    setMutedUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    showToast('User muted from your feed', 'info');
  };

  const unmuteUser = (userId: string) => {
    setMutedUserIds((prev) => prev.filter((id) => id !== userId));
    showToast('User unmuted', 'info');
  };

  // Modals & UI States
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState(false);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [reportingTarget, setReportingTarget] = useState<{ isOpen: boolean; type: 'post' | 'user'; id: string; name?: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [isDataLoading, setIsDataLoading] = useState(false);

  const refreshData = async () => {
    try {
      setIsDataLoading(true);
      const data = await api.getBootstrap(currentUser.id);
      if (data) {
        if (Array.isArray(data.posts)) setPosts(data.posts);
        if (data.comments) setComments(data.comments);
        if (Array.isArray(data.stories)) setStories(data.stories);
        if (Array.isArray(data.conversations)) setConversations(data.conversations);
        if (Array.isArray(data.communities)) setCommunities(data.communities);
        if (Array.isArray(data.marketplaceListings)) setMarketplaceListings(data.marketplaceListings);
        if (Array.isArray(data.notifications)) setNotifications(data.notifications);
        if (Array.isArray(data.reportedItems)) setReportedItems(data.reportedItems);
        if (Array.isArray(data.allUsers) && data.allUsers.length > 0) setAllUsers(data.allUsers);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err: any) {
      console.warn('Backend snapshot unavailable, continuing with cached data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const uploadMedia = async (dataUrl: string, filename?: string): Promise<string> => {
    try {
      return await api.uploadMedia(dataUrl, filename);
    } catch (err: any) {
      console.warn('Backend upload error, falling back to data URL:', err);
      return dataUrl;
    }
  };

  const resolveModerationReport = async (reportId: string, action: 'resolve' | 'dismiss' | 'delete_content') => {
    try {
      await api.moderationAction(reportId, action);
      setReportedItems((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' } : r
        )
      );
      if (action === 'delete_content') {
        const report = reportedItems.find((r) => r.id === reportId);
        if (report?.targetType === 'post') {
          setPosts((prev) => prev.filter((p) => p.id !== report.targetId));
          setComments((prev) => {
            const next = { ...prev };
            delete next[report.targetId];
            return next;
          });
        }
      }
      showToast(action === 'dismiss' ? 'Report dismissed as compliant' : 'Content action applied successfully', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to apply moderation action', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        deviceMode,
        setDeviceMode,
        activeTab,
        setActiveTab,
        activeView,
        setActiveView,
        activeCommunityId,
        setActiveCommunityId,
        isAndroidDrawerOpen,
        setIsAndroidDrawerOpen,
        activeSettingsSection,
        setActiveSettingsSection,
        settingsHistory,
        pushSettingsSection,
        popSettingsSection,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        register,
        logout,
        currentUser,
        allUsers,
        switchUser,
        updateCurrentUser,
        viewingUser,
        setViewingUser,
        toggleFollowUser,
        acceptFollowRequest,
        declineFollowRequest,
        posts: posts.filter(
          (p) => !blockedUserIds.includes(p.author.id) && !mutedUserIds.includes(p.author.id)
        ),
        comments,
        createPost,
        toggleLikePost,
        reactToPost,
        toggleSavePost,
        toggleRepostPost,
        resharePostWithQuote,
        votePoll,
        deletePost,
        addComment,
        addVoiceComment,
        deleteComment,
        toggleLikeComment,
        stories,
        createStory,
        markStoryViewed,
        reactToStory,
        addStoryComment,
        deleteStory,
        activeStoryIndex,
        setActiveStoryIndex,
        reshareModalPost,
        setReshareModalPost,
        conversations: conversations.filter(
          (c) => !c.participants.some((p) => p.id !== currentUser.id && blockedUserIds.includes(p.id))
        ),
        activeConversationId,
        setActiveConversationId,
        sendMessage,
        startNewConversation,
        togglePinMessage,
        reactToMessage,
        communities,
        createCommunity,
        createCommunityDetailed,
        updateCommunity,
        deleteCommunity,
        joinCommunity,
        leaveCommunity,
        switchCommunityChannel,
        approvePendingMember,
        rejectPendingMember,
        addCommunityAnnouncement,
        deleteCommunityAnnouncement,
        addCommunityEvent,
        toggleCommunityEventRsvp,
        togglePinPostInCommunity,
        addCommunityChannel,
        deleteCommunityChannel,
        addCommunityRule,
        deleteCommunityRule,
        assignMemberRole,
        removeMemberFromCommunity,
        isCreateCommunityOpen,
        setIsCreateCommunityOpen,
        createCommunityInitialType,
        openCreateCommunity,
        communityDashboardTab,
        setCommunityDashboardTab,
        products,
        addProduct,
        analytics,
        marketplaceListings,
        createListing,
        updateListing,
        deleteListing,
        toggleSaveListing,
        markListingStatus,
        contactSeller,
        createListingModalOpen,
        setCreateListingModalOpen,
        activeListing,
        setActiveListing,
        openUserProfile,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationsCount,
        notificationsModalOpen,
        setNotificationsModalOpen,
        settings,
        updateSettings,
        reportedItems,
        reportItem,
        blockedUserIds,
        blockUser,
        unblockUser,
        mutedUserIds,
        muteUser,
        unmuteUser,
        createPostModalOpen,
        setCreatePostModalOpen,
        createStoryModalOpen,
        setCreateStoryModalOpen,
        aiAssistantModalOpen,
        setAiAssistantModalOpen,
        moderationModalOpen,
        setModerationModalOpen,
        editProfileModalOpen,
        setEditProfileModalOpen,
        reportingTarget,
        setReportingTarget,
        isSplashScreenActive,
        setIsSplashScreenActive,
        toasts,
        showToast,
        removeToast,
        refreshData,
        isDataLoading,
        uploadMedia,
        resolveModerationReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
