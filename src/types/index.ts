export type DeviceMode = 'auto' | 'android' | 'tablet' | 'desktop';

export type AndroidTab = 'home' | 'explore' | 'create' | 'messages' | 'market' | 'profile';

export type AndroidSettingsSection =
  | 'overview'
  | 'account'
  | 'profile'
  | 'privacy'
  | 'security'
  | 'notifications'
  | 'appearance'
  | 'data-storage'
  | 'accessibility'
  | 'content'
  | 'ai'
  | 'language'
  | 'help-legal';

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  bio: string;
  website?: string;
  location?: string;
  joinedDate: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate?: boolean;
  isFollowing?: boolean;
  isRequested?: boolean;
  followers?: string[]; // user IDs
  following?: string[]; // user IDs
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  userVotedId?: string;
  totalVotes: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  voiceUrl?: string; // audio data URL or blob URL
  voiceDuration?: number; // seconds, strictly max 120
  createdAt: string;
  createdTimestamp?: number;
  editedAt?: string;
  likesCount: number;
  isLiked?: boolean;
  likedBy?: string[];
  parentCommentId?: string;
  replies?: Comment[];
}

export type ReactionType = 'like' | 'love' | 'fire' | 'rose' | 'clap' | 'insight';

export interface PostReaction {
  userId: string;
  userName: string;
  userAvatar?: string;
  reaction: ReactionType;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  media?: string[];
  poll?: Poll;
  createdAt: string;
  createdTimestamp: number;
  likesCount: number;
  reactions?: Record<string, ReactionType>; // userId -> reaction
  reactionCounts?: Partial<Record<ReactionType, number>>;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  isLiked?: boolean;
  userReaction?: ReactionType;
  isReposted?: boolean;
  isSaved?: boolean;
  communityId?: string;
  communityName?: string;
  tags?: string[];
  resharedPost?: Post; // Embedded original post when shared
  repostCaption?: string;
}

export interface StoryComment {
  id: string;
  storyId: string;
  author: User;
  text?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  createdAt: string;
  createdTimestamp: number;
}

export interface StoryViewer {
  userId: string;
  userName: string;
  userHandle?: string;
  userAvatar?: string;
  viewedAt: string;
}

export interface StoryReaction {
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: string;
  timestamp: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  storyThumbnail?: string;
  mediaType: 'photo' | 'video' | 'text';
  mediaUrl: string; // image/video URL, or empty for text stories
  textContent?: string;
  bgColor?: string; // CSS gradient class or hex for text stories
  caption?: string;
  createdAt: string;
  createdTimestamp: number;
  expiresInHours: number;
  audience: 'everyone' | 'followers' | 'close-friends';
  viewers: StoryViewer[];
  reactions: StoryReaction[];
  comments?: StoryComment[];
  isViewed?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  audioDuration?: number; // seconds if voice note
  createdAt: string;
  isRead: boolean;
  isPinned?: boolean;
  reaction?: string;
}

export interface Conversation {
  id: string;
  title: string;
  isGroup: boolean;
  avatar: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  lastMessageTime: string;
  pinnedMessage?: Message;
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
}

export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatar?: string;
  isPinned?: boolean;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  attendeesCount: number;
  isAttending?: boolean;
}

export interface CommunityPendingMember {
  user: User;
  appliedAt: string;
  answers: Record<string, string>;
}

export interface CommunityModerationLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}

export interface CommunityMemberRole {
  user: User;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedDate: string;
}

export interface CommunityAiAssistant {
  enabled: boolean;
  explicitAdminApproved: boolean;
  botName: string;
  personality: 'welcoming' | 'moderator' | 'concierge' | 'creative';
  autoSummaries: boolean;
  autoWelcomeNewMembers: boolean;
  answerQuestionsWithDocs: boolean;
}

export interface Community {
  id: string;
  type?: 'community' | 'group';
  name: string;
  slug: string;
  description: string;
  avatar: string;
  coverImage: string;
  category?: string;
  badge?: string;
  membersCount: number;
  isJoined: boolean;
  isPrivate: boolean;
  discoverability?: 'visible' | 'hidden';
  whoCanJoin?: 'anyone' | 'approval_required' | 'invite_only';
  inviteLink?: string;
  requireAdminApprovalForJoin?: boolean;
  ownerId?: string;
  owner?: User;
  admins?: User[];
  moderators?: User[];
  memberList?: CommunityMemberRole[];
  memberPermissions?: {
    canPost: boolean;
    canCreatePolls: boolean;
    canUploadMedia: boolean;
    canInviteOthers: boolean;
  };
  postingApproval?: 'instant' | 'admin_review';
  membershipQuestions?: string[];
  rules: (string | CommunityRule)[];
  spamPrevention?: {
    autoFilterSpam: boolean;
    blockExternalLinks: boolean;
    minAccountAgeDays: number;
  };
  pendingMembers?: CommunityPendingMember[];
  moderationLog?: CommunityModerationLog[];
  channels: string[];
  activeChannel: string;
  topics?: string[];
  pinnedPostIds?: string[];
  announcements?: CommunityAnnouncement[];
  events?: CommunityEvent[];
  aiAssistant?: CommunityAiAssistant;
  notificationsSettings?: {
    notifyOnNewPost: boolean;
    notifyOnMemberJoin: boolean;
    emailDigest: 'daily' | 'weekly' | 'never';
  };
  chatPermissions?: 'members' | 'admins_only' | 'disabled';
  allowMemberInvites?: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  salesCount: number;
  rating: number;
  stockStatus: 'in-stock' | 'pre-order' | 'digital';
}

export interface CreatorAnalytics {
  impressions30d: number;
  impressionsGrowth: number;
  reach30d: number;
  reachGrowth: number;
  profileVisits30d: number;
  engagementRate: number;
  followersGrowthHistory: { day: string; count: number }[];
  topPostImpressions: number;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'reaction' | 'comment' | 'reply' | 'follow' | 'follow_request' | 'story_reaction' | 'story_reply' | 'mention' | 'community' | 'security';
  actor: User;
  title: string;
  previewText?: string;
  timestamp: string;
  isRead: boolean;
  targetType?: 'post' | 'story' | 'user' | 'message';
  targetId?: string;
  requestId?: string; // for follow requests
  handled?: boolean; // if follow request was accepted/declined
}

export interface UserSettings {
  account: {
    email: string;
    phone: string;
    recoveryEmail: string;
    twoFactorEnabled: boolean;
  };
  privacy: {
    isPrivateAccount: boolean;
    allowDirectMessagesFrom: 'everyone' | 'following' | 'none';
    showActivityStatus: boolean;
    readReceipts: boolean;
    storyAudienceDefault: 'everyone' | 'followers' | 'close-friends';
    whoCanComment: 'everyone' | 'followers' | 'none';
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor?: string;
    pinkAccentIntensity: 'vibrant' | 'deep' | 'soft';
    compactMode: boolean;
  };
  notifications: {
    pushEnabled: boolean;
    mentions: boolean;
    reactions: boolean;
    directMessages: boolean;
    storyReactions: boolean;
    communityUpdates: boolean;
    soundEnabled: boolean;
  };
  dataAndStorage: {
    mediaAutoDownload: 'wifi-only' | 'always' | 'never';
    highQualityUploads: boolean;
    cacheSizeMb: number;
  };
  accessibility: {
    fontScale: number; // 80 to 130 %
    reduceMotion: boolean;
    highContrast: boolean;
  };
  contentPreferences: {
    sensitiveContentFilter: 'standard' | 'strict' | 'off';
    mutedWords: string[];
    feedAlgorithm: 'smart' | 'chronological';
  };
  aiPreferences: {
    assistantEnabled: boolean;
    autoCaptionSuggestions: boolean;
    postSummariesEnabled: boolean;
    dataShareConsent: boolean;
  };
  language: {
    current: string;
    timeFormat: '12h' | '24h';
  };
}

export interface ReportedItem {
  id: string;
  targetType: 'post' | 'user' | 'message' | 'listing';
  targetId: string;
  reason: string;
  reporterHandle: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export type ProductCategory =
  | 'All'
  | 'Electronics'
  | 'Phones'
  | 'Fashion'
  | 'Shoes'
  | 'Home & Living'
  | 'Vehicles'
  | 'Property'
  | 'Beauty'
  | 'Health'
  | 'Food'
  | 'Services'
  | 'Sports'
  | 'Books'
  | 'Gaming'
  | 'Art & Collectibles'
  | 'Other';

export type ProductCondition = 'New' | 'Like New' | 'Good' | 'Fair';
export type ListingStatus = 'available' | 'sold' | 'pending';

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  images: string[];
  seller: User;
  location: string;
  status: ListingStatus;
  createdAt: string;
  createdTimestamp: number;
  isSaved?: boolean;
  viewsCount: number;
  sharesCount: number;
}
