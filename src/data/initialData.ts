import {
  User,
  Post,
  Story,
  Conversation,
  Community,
  Product,
  CreatorAnalytics,
  NotificationItem,
  UserSettings,
  Comment,
  MarketplaceListing,
} from '../types';

// New installations start with no seeded member accounts. Real profiles are created by registration.
export const INITIAL_MEMBERS: User[] = [];
export const TEST_ACCOUNTS = INITIAL_MEMBERS;

// Guest placeholder used only until the visitor signs in or creates an account.
export const DEFAULT_CURRENT_USER: User = {
  id: 'guest',
  name: 'Guest',
  handle: 'guest',
  avatar: '',
  banner: '',
  bio: '',
  joinedDate: '',
  verified: false,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  isPrivate: false,
  followers: [],
  following: [],
};

// No fake/demo content - only genuine user-created records
export const INITIAL_STORIES: Story[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_COMMENTS: Record<string, Comment[]> = {};

export const INITIAL_CONVERSATIONS: Conversation[] = [];

export const INITIAL_COMMUNITIES: Community[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_MARKETPLACE_LISTINGS: MarketplaceListing[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_ANALYTICS: CreatorAnalytics = {
  impressions30d: 0,
  impressionsGrowth: 0,
  reach30d: 0,
  reachGrowth: 0,
  profileVisits30d: 0,
  engagementRate: 0,
  followersGrowthHistory: [
    { day: 'Day 1', count: 0 },
    { day: 'Day 5', count: 0 },
    { day: 'Day 10', count: 0 },
    { day: 'Day 15', count: 0 },
    { day: 'Day 20', count: 0 },
    { day: 'Day 25', count: 0 },
    { day: 'Day 30', count: 0 },
  ],
  topPostImpressions: 0,
};

export const INITIAL_SETTINGS: UserSettings = {
  account: {
    email: '',
    phone: '',
    recoveryEmail: '',
    twoFactorEnabled: false,
  },
  privacy: {
    isPrivateAccount: false,
    allowDirectMessagesFrom: 'everyone',
    showActivityStatus: true,
    readReceipts: true,
    storyAudienceDefault: 'everyone',
    whoCanComment: 'everyone',
  },
  appearance: {
    theme: 'light',
    pinkAccentIntensity: 'vibrant',
    compactMode: false,
  },
  notifications: {
    pushEnabled: true,
    mentions: true,
    reactions: true,
    directMessages: true,
    storyReactions: true,
    communityUpdates: true,
    soundEnabled: true,
  },
  dataAndStorage: {
    mediaAutoDownload: 'wifi-only',
    highQualityUploads: true,
    cacheSizeMb: 0,
  },
  accessibility: {
    fontScale: 100,
    reduceMotion: false,
    highContrast: false,
  },
  contentPreferences: {
    sensitiveContentFilter: 'standard',
    mutedWords: [],
    feedAlgorithm: 'smart',
  },
  aiPreferences: {
    assistantEnabled: true,
    autoCaptionSuggestions: true,
    postSummariesEnabled: true,
    dataShareConsent: false,
  },
  language: {
    current: 'English (US)',
    timeFormat: '12h',
  },
};
