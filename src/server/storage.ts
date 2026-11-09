import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  Post,
  Story,
  Conversation,
  Message,
  Community,
  Channel,
  Product,
  NotificationItem,
  UserSettings,
  Comment,
  MarketplaceListing,
  MarketplaceStore,
  ReportedItem,
  ReactionType,
} from '../types';
import {
  INITIAL_SETTINGS,
} from '../data/initialData';

export interface DatabaseSchema {
  users: User[];
  userCredentials?: Record<string, { email: string; passwordHash: string; salt: string; createdAt: number }>;
  sessions?: Record<string, { userId: string; createdAt: number; expiresAt: number }>;
  posts: Post[];
  comments: Record<string, Comment[]>;
  stories: Story[];
  conversations: Conversation[];
  communities: Community[];
  channels?: Channel[];
  products: Product[];
  marketplaceListings: MarketplaceListing[];
  marketplaceStores?: MarketplaceStore[];
  notifications: NotificationItem[];
  reportedItems: ReportedItem[];
  settings: Record<string, UserSettings>;
  blockedUsers: Record<string, string[]>;
  mutedUsers: Record<string, string[]>;
  savedPosts?: Record<string, string[]>;
}

const isServerless = !!(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.VERCEL ||
  process.env.LAMBDA_TASK_ROOT
);

const DATA_DIR = isServerless
  ? path.join('/tmp', '.roseone-data')
  : path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'roseone-db.json');

// Production starts empty: real users and content are created by members.
const getInitialDatabase = (): DatabaseSchema => ({
  users: [],
  userCredentials: {},
  sessions: {},
  posts: [],
  comments: {},
  stories: [],
  conversations: [],
  communities: [],
  channels: [],
  products: [],
  marketplaceListings: [],
  marketplaceStores: [],
  notifications: [],
  reportedItems: [],
  settings: {},
  blockedUsers: {},
  mutedUsers: {},
  savedPosts: {},
});

const LEGACY_DEMO_USER_IDS = new Set(['user_clara', 'user_mateo', 'user_sophia', 'user_roseone']);
const LEGACY_DEMO_HANDLES = new Set(['claravane', 'mateochen', 'sophiathorne', 'roseone']);
const isLegacyDemoPost = (post: any) =>
  !post ||
  String(post.id || '').startsWith('post_launch_') ||
  String(post.id || '').startsWith('post_welcome_') ||
  LEGACY_DEMO_USER_IDS.has(String(post.author?.id || ''));

/** Remove the old built-in showcase accounts/content from existing local JSON databases. */
const cleanLegacyDatabase = (source: DatabaseSchema): DatabaseSchema => {
  const db = { ...getInitialDatabase(), ...source } as DatabaseSchema;
  const removedUserIds = new Set(
    (db.users || [])
      .filter((user) => LEGACY_DEMO_USER_IDS.has(user.id) || LEGACY_DEMO_HANDLES.has((user.handle || '').toLowerCase()))
      .map((user) => user.id),
  );
  LEGACY_DEMO_USER_IDS.forEach((id) => removedUserIds.add(id));

  db.users = (db.users || []).filter(
    (user) => !removedUserIds.has(user.id) && !LEGACY_DEMO_HANDLES.has((user.handle || '').toLowerCase()),
  );
  db.posts = (db.posts || []).filter((post) => !isLegacyDemoPost(post));
  const validPostIds = new Set(db.posts.map((post) => post.id));
  db.comments = Object.fromEntries(
    Object.entries(db.comments || {}).filter(([postId]) => validPostIds.has(postId)),
  );
  db.stories = (db.stories || []).filter(
    (story) => !removedUserIds.has(story.userId) && !String(story.id || '').startsWith('story_clara_') && !String(story.id || '').startsWith('story_mateo_'),
  );
  db.conversations = (db.conversations || []).filter(
    (conversation) => conversation.id !== 'conv_clara_mateo' && !(conversation.participants || []).some((participant) => removedUserIds.has(participant.id)),
  );
  db.communities = (db.communities || []).filter((community) => community.id !== 'comm_creators');
  for (const id of removedUserIds) {
    delete db.userCredentials?.[id];
    delete db.sessions?.[id];
    delete db.settings?.[id];
    delete db.blockedUsers?.[id];
    delete db.mutedUsers?.[id];
    delete db.savedPosts?.[id];
  }
  db.sessions = db.sessions || {};
  db.userCredentials = db.userCredentials || {};
  db.settings = db.settings || {};
  db.blockedUsers = db.blockedUsers || {};
  db.mutedUsers = db.mutedUsers || {};
  db.savedPosts = db.savedPosts || {};
  db.channels = db.channels || [];
  db.products = db.products || [];
  db.marketplaceListings = db.marketplaceListings || [];
  db.marketplaceStores = db.marketplaceStores || [];
  db.notifications = (db.notifications || []).filter((item) => !removedUserIds.has(item.actor?.id));
  db.reportedItems = db.reportedItems || [];
  return db;
};

export class PersistentStorage {
  private db: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;
  private durableClient: SupabaseClient | null = null;
  private durableInitialized = false;
  private durableInitPromise: Promise<void> | null = null;
  private durableSavePromise: Promise<void> = Promise.resolve();
  private durableDirty = false;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.posts)) {
          const cleaned = cleanLegacyDatabase(parsed as DatabaseSchema);
          this.persistSync(cleaned);
          return cleaned;
        }
      }
    } catch (err) {
      console.error('Error reading persistent database, seeding new database:', err);
    }

    const freshDb = getInitialDatabase();
    this.persistSync(freshDb);
    return freshDb;
  }

  private persistSync(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  /**
   * Load the shared app snapshot before serving requests. Supabase is the
   * durable source of truth; the JSON file remains a local fallback/cache.
   * Credentials and legacy sessions are deliberately never uploaded.
   */
  public async initializeDurable(): Promise<void> {
    if (this.durableInitialized) return;
    if (this.durableInitPromise) return this.durableInitPromise;

    this.durableInitPromise = (async () => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SECRET_KEY;
      if (!url || !key) {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
        const message = '[storage] Durable storage is unavailable: set SUPABASE_URL and SUPABASE_SECRET_KEY on the server. Local JSON is not durable on Render.';
        if (isProduction) throw new Error(message);
        console.warn(`${message} Using local JSON only in development.`);
        this.durableInitialized = true;
        return;
      }

      this.durableClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await this.durableClient
        .from('gistupp_app_state')
        .select('state')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw new Error(`Could not load shared app data from Supabase: ${error.message}`);

      if (data?.state && typeof data.state === 'object') {
        const remote = data.state as Partial<DatabaseSchema>;
        const localCredentials = this.db.userCredentials || {};
        const localSessions = this.db.sessions || {};
        this.db = cleanLegacyDatabase({
          ...getInitialDatabase(),
          ...remote,
          userCredentials: localCredentials,
          sessions: localSessions,
        } as DatabaseSchema);
        const migrated = await this.migrateInlineImages(this.db);
        if (migrated.changed) {
          this.db = cleanLegacyDatabase(migrated.value as DatabaseSchema);
          await this.persistDurable();
          console.info('[storage] Legacy inline images migrated to Supabase Storage.');
        }
        this.persistSync(this.db);
        console.info('[storage] Shared app data loaded from Supabase.');
      } else {
        // First-time bootstrap: preserve any existing local data instead of
        // replacing it with an empty snapshot.
        await this.persistDurable();
        console.info('[storage] Initial shared app snapshot created in Supabase.');
      }
      this.durableInitialized = true;
    })();

    try {
      await this.durableInitPromise;
    } catch (error) {
      this.durableInitPromise = null;
      throw error;
    }
  }

  /** Move legacy inline image data out of the JSON snapshot before the next durable write. */
  private async migrateInlineImages(value: any, cache = new Map<string, string>()): Promise<{ value: any; changed: boolean }> {
    if (typeof value === 'string') {
      const match = value.match(/^data:(image[/](jpeg|jpg|png|webp|gif));base64,(.*)$/i);
      if (!match || !this.durableClient) return { value, changed: false };
      const cached = cache.get(value);
      if (cached) return { value: cached, changed: true };
      const mimeType = match[1].toLowerCase();
      const ext = mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'jpg' : mimeType.split('/')[1];
      const objectPath = `legacy-import/${crypto.randomUUID()}.${ext}`;
      const bytes = Buffer.from(match[3], 'base64');
      const { error } = await this.durableClient.storage.from('gistupp-public').upload(objectPath, bytes, {
        contentType: mimeType,
        upsert: false,
        cacheControl: '31536000',
      });
      if (error) throw new Error(`Could not migrate an existing image to Supabase Storage: ${error.message}`);
      const publicUrl = this.durableClient.storage.from('gistupp-public').getPublicUrl(objectPath).data.publicUrl;
      cache.set(value, publicUrl);
      return { value: publicUrl, changed: true };
    }
    if (Array.isArray(value)) {
      let changed = false;
      const next = [];
      for (const item of value) {
        const result = await this.migrateInlineImages(item, cache);
        next.push(result.value);
        changed = changed || result.changed;
      }
      return { value: next, changed };
    }
    if (value && typeof value === 'object') {
      let changed = false;
      const next: Record<string, any> = {};
      for (const [key, item] of Object.entries(value)) {
        const result = await this.migrateInlineImages(item, cache);
        next[key] = result.value;
        changed = changed || result.changed;
      }
      return { value: next, changed };
    }
    return { value, changed: false };
  }

  private async persistDurable(): Promise<void> {
    if (!this.durableClient) return;
    const { userCredentials: _credentials, sessions: _sessions, ...safeState } = this.db;
    const { error } = await this.durableClient.from('gistupp_app_state').upsert({
      id: 1,
      state: safeState,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) {
      throw new Error(`[storage] Supabase durable save failed: ${error.message}`);
    }
  }

  private queueDurableSave(): void {
    this.durableDirty = false;
    // Recover the queue after a transient database failure so a later user
    // action can retry instead of inheriting a permanently rejected promise.
    const nextSave = this.durableSavePromise
      .catch(() => undefined)
      .then(() => this.persistDurable());
    this.durableSavePromise = nextSave;
    void nextSave.catch((error) => {
      this.durableDirty = true;
      console.error('[storage] Durable save queue failed:', error);
    });
  }

  /** Wait until the latest mutation has reached Supabase before sending its API response. */
  public async flushDurable(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    if (this.durableDirty) {
      this.persistSync(this.db);
      this.queueDurableSave();
    }
    await this.durableSavePromise;
  }

  public schedulePersist(): void {
    this.durableDirty = true;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistSync(this.db);
      this.saveTimeout = null;
      // Serialize writes from this process so an older snapshot cannot finish
      // after a newer one. API responses also await flushDurable().
      this.queueDurableSave();
    }, 150);
  }

  // --- Snapshot / Bootstrap ---
  public getBootstrapData(currentUserId: string) {
    const user = this.db.users.find((u) => u.id === currentUserId) || this.db.users[0];
    const userSettings = this.db.settings[currentUserId] || INITIAL_SETTINGS;

    // Filter active stories (< 24h old)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const activeStories = this.db.stories.filter((s) => s.createdTimestamp > cutoff);

    // Filter user's notifications
    const userNotifs = this.db.notifications.filter(
      (n) => (n.actor && n.actor.id !== currentUserId) || n.type === 'security'
    );

    return {
      currentUser: user,
      allUsers: this.db.users,
      posts: this.db.posts,
      comments: this.db.comments,
      stories: activeStories,
      conversations: this.getConversations(currentUserId),
      communities: this.db.communities,
      channels: this.getChannels(currentUserId),
      marketplaceListings: this.db.marketplaceListings,
      products: this.db.products || [],
      notifications: userNotifs,
      reportedItems: this.db.reportedItems,
      settings: userSettings,
      blockedUserIds: this.db.blockedUsers[currentUserId] || [],
      mutedUserIds: this.db.mutedUsers[currentUserId] || [],
    };
  }

  // --- Standalone Channels ---
  public getChannels(userId: string): Channel[] {
    return (this.db.channels || [])
      .filter((channel) => !channel.isPrivate || channel.ownerId === userId || channel.adminIds.includes(userId) || channel.subscriberIds.includes(userId))
      .map((channel) => ({ ...channel, isSubscribed: channel.ownerId === userId || channel.subscriberIds.includes(userId) }));
  }

  public createChannel(ownerId: string, data: { name: string; description: string; isPrivate?: boolean; avatar?: string; coverImage?: string }): Channel {
    const owner = this.getUserById(ownerId);
    if (!owner) throw new Error('Channel owner not found.');
    const name = String(data.name || '').trim();
    if (name.length < 2) throw new Error('Channel name must be at least 2 characters.');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if ((this.db.channels || []).some((channel) => channel.slug === slug)) throw new Error('A channel with this name already exists.');
    const channel: Channel = {
      id: `channel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      slug,
      description: String(data.description || '').trim(),
      avatar: data.avatar || '',
      coverImage: data.coverImage || '',
      owner,
      ownerId,
      adminIds: [ownerId],
      subscriberIds: [],
      isPrivate: !!data.isPrivate,
      posts: [],
      createdAt: new Date().toISOString(),
      isSubscribed: true,
    };
    this.db.channels = this.db.channels || [];
    this.db.channels.unshift(channel);
    this.schedulePersist();
    return channel;
  }

  public toggleChannelSubscription(channelId: string, userId: string): Channel {
    const channel = (this.db.channels || []).find((item) => item.id === channelId);
    if (!channel) throw new Error('Channel not found.');
    if (channel.ownerId === userId) return { ...channel, isSubscribed: true };
    const index = channel.subscriberIds.indexOf(userId);
    if (index >= 0) channel.subscriberIds.splice(index, 1);
    else channel.subscriberIds.push(userId);
    this.schedulePersist();
    return { ...channel, isSubscribed: index < 0 };
  }

  public createChannelPost(channelId: string, authorId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video'): Channel {
    const channel = (this.db.channels || []).find((item) => item.id === channelId);
    const author = this.getUserById(authorId);
    if (!channel || !author) throw new Error('Channel or author not found.');
    if (channel.ownerId !== authorId && !channel.adminIds.includes(authorId)) throw new Error('Only channel admins can publish posts.');
    if (!content.trim() && !mediaUrl) throw new Error('Add text or media before publishing.');
    channel.posts.unshift({
      id: `channel_post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      author,
      content: content.trim(),
      mediaUrl,
      mediaType,
      createdAt: new Date().toISOString(),
      createdTimestamp: Date.now(),
    });
    this.schedulePersist();
    return channel;
  }

  public deleteChannel(channelId: string, userId: string): void {
    const channel = (this.db.channels || []).find((item) => item.id === channelId);
    if (!channel) throw new Error('Channel not found.');
    if (channel.ownerId !== userId) throw new Error('Only the channel owner can delete this channel.');
    this.db.channels = (this.db.channels || []).filter((item) => item.id !== channelId);
    this.schedulePersist();
  }

  // --- Users & Profiles ---
  public getUsers(): User[] {
    return this.db.users;
  }

  public getUserById(id: string): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  /** Keep the legacy feature store's profile projection aligned with Supabase Auth. */
  public upsertSupabaseUser(profile: User): User {
    const existingIndex = this.db.users.findIndex((user) => user.id === profile.id);
    if (existingIndex >= 0) {
      const existing = this.db.users[existingIndex];
      const updated: User = {
        ...existing,
        name: profile.name || existing.name,
        handle: existing.handle || profile.handle,
        avatar: existing.avatar || profile.avatar,
        joinedDate: existing.joinedDate || profile.joinedDate,
      };
      this.db.users[existingIndex] = updated;
      this.schedulePersist();
      return updated;
    }
    this.db.users.push(profile);
    this.db.settings[profile.id] = this.db.settings[profile.id] || INITIAL_SETTINGS;
    this.schedulePersist();
    return profile;
  }

  public updateProfile(userId: string, updates: Partial<User>): User {
    const index = this.db.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('User not found');
    }

    const updated = { ...this.db.users[index], ...updates };
    this.db.users[index] = updated;

    // Update author across posts
    this.db.posts = this.db.posts.map((post) =>
      post.author.id === userId ? { ...post, author: { ...post.author, ...updates } } : post
    );

    this.schedulePersist();
    return updated;
  }

  public toggleFollow(currentUserId: string, targetUserId: string): { isFollowing: boolean; targetUser: User; currentUser: User } {
    if (currentUserId === targetUserId) {
      throw new Error('Cannot follow yourself');
    }

    const currentUser = this.getUserById(currentUserId);
    const targetUser = this.getUserById(targetUserId);
    if (!currentUser || !targetUser) {
      throw new Error('User not found');
    }

    const isFollowing = currentUser.following?.includes(targetUserId) || false;

    if (isFollowing) {
      // Unfollow
      currentUser.following = (currentUser.following || []).filter((id) => id !== targetUserId);
      currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);

      targetUser.followers = (targetUser.followers || []).filter((id) => id !== currentUserId);
      targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
      targetUser.isFollowing = false;
    } else {
      // Follow
      if (!currentUser.following) currentUser.following = [];
      currentUser.following.push(targetUserId);
      currentUser.followingCount = (currentUser.followingCount || 0) + 1;

      if (!targetUser.followers) targetUser.followers = [];
      targetUser.followers.push(currentUserId);
      targetUser.followersCount = (targetUser.followersCount || 0) + 1;
      targetUser.isFollowing = true;

      // Add notification for target user
      this.addNotification({
        type: targetUser.isPrivate ? 'follow_request' : 'follow',
        actor: currentUser,
        title: targetUser.isPrivate ? 'requested to follow you' : 'started following you',
        previewText: currentUser.bio || `@${currentUser.handle}`,
        targetType: 'user',
        targetId: currentUser.id,
      });
    }

    this.schedulePersist();
    return { isFollowing: !isFollowing, targetUser, currentUser };
  }

  public toggleBlockUser(currentUserId: string, targetUserId: string): boolean {
    if (!this.db.blockedUsers) this.db.blockedUsers = {};
    if (!this.db.blockedUsers[currentUserId]) this.db.blockedUsers[currentUserId] = [];

    const list = this.db.blockedUsers[currentUserId];
    const isBlocked = list.includes(targetUserId);

    if (isBlocked) {
      this.db.blockedUsers[currentUserId] = list.filter((id) => id !== targetUserId);
    } else {
      list.push(targetUserId);
    }

    this.schedulePersist();
    return !isBlocked;
  }

  public toggleMuteUser(currentUserId: string, targetUserId: string): boolean {
    if (!this.db.mutedUsers) this.db.mutedUsers = {};
    if (!this.db.mutedUsers[currentUserId]) this.db.mutedUsers[currentUserId] = [];

    const list = this.db.mutedUsers[currentUserId];
    const isMuted = list.includes(targetUserId);

    if (isMuted) {
      this.db.mutedUsers[currentUserId] = list.filter((id) => id !== targetUserId);
    } else {
      list.push(targetUserId);
    }

    this.schedulePersist();
    return !isMuted;
  }

  // --- Posts ---
  public getPosts(): Post[] {
    return this.db.posts;
  }

  public createPost(authorId: string, content: string, media?: string[], pollData?: { question: string; options: string[] }, tags?: string[], communityId?: string): Post {
    const author = this.getUserById(authorId);
    if (!author) throw new Error('Author not found');

    const now = Date.now();
    const newPost: Post = {
      id: `post_${now}_${Math.random().toString(36).substring(2, 6)}`,
      author,
      content,
      media: Array.isArray(media) ? media : [],
      createdAt: 'Just now',
      createdTimestamp: now,
      likesCount: 0,
      reactions: {},
      reactionCounts: {},
      commentsCount: 0,
      repostsCount: 0,
      viewsCount: 1,
      tags: tags || [],
      communityId,
    };

    if (pollData && pollData.question.trim() && pollData.options.length >= 2) {
      newPost.poll = {
        id: `poll_${now}`,
        question: pollData.question.trim(),
        options: pollData.options.map((opt, idx) => ({
          id: `opt_${idx}`,
          text: opt.trim(),
          votes: 0,
        })),
        totalVotes: 0,
      };
    }

    this.db.posts.unshift(newPost);
    author.postsCount = (author.postsCount || 0) + 1;

    this.schedulePersist();
    return newPost;
  }

  public deletePost(postId: string, userId: string): boolean {
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post) return false;

    // Permissions: post author or admin
    if (post.author.id !== userId && userId !== 'user_main') {
      throw new Error('Unauthorized to delete post');
    }

    this.db.posts = this.db.posts.filter((p) => p.id !== postId);
    delete this.db.comments[postId];

    const author = this.getUserById(post.author.id);
    if (author) {
      author.postsCount = Math.max(0, (author.postsCount || 1) - 1);
    }

    this.schedulePersist();
    return true;
  }

  public toggleLikePost(postId: string, userId: string, reaction: ReactionType = 'like'): { post: Post; isLiked: boolean } {
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (!post.reactions) post.reactions = {};
    if (!post.reactionCounts) post.reactionCounts = {};

    const existingReaction = post.reactions[userId];
    let isLiked = false;

    if (existingReaction === reaction) {
      // Remove reaction
      delete post.reactions[userId];
      post.likesCount = Math.max(0, post.likesCount - 1);
      if (post.reactionCounts[reaction]) {
        post.reactionCounts[reaction] = Math.max(0, (post.reactionCounts[reaction] || 1) - 1);
      }
      isLiked = false;
    } else {
      // Add or change reaction
      if (existingReaction) {
        // Change from old to new reaction
        if (post.reactionCounts[existingReaction]) {
          post.reactionCounts[existingReaction] = Math.max(0, (post.reactionCounts[existingReaction] || 1) - 1);
        }
      } else {
        post.likesCount += 1;
      }

      post.reactions[userId] = reaction;
      post.reactionCounts[reaction] = (post.reactionCounts[reaction] || 0) + 1;
      isLiked = true;

      // Add notification to post author if not self
      if (post.author.id !== userId) {
        const actor = this.getUserById(userId);
        if (actor) {
          this.addNotification({
            type: 'reaction',
            actor,
            title: `reacted to your post`,
            previewText: post.content.substring(0, 70),
            targetType: 'post',
            targetId: post.id,
          });
        }
      }
    }

    this.schedulePersist();
    return { post, isLiked };
  }

  public setPostReaction(postId: string, userId: string, reaction: ReactionType = 'like'): Post {
    const { post } = this.toggleLikePost(postId, userId, reaction);
    return post;
  }

  public toggleSavePost(postId: string, userId: string): boolean {
    if (!this.db.savedPosts) this.db.savedPosts = {};
    if (!this.db.savedPosts[userId]) this.db.savedPosts[userId] = [];

    const list = this.db.savedPosts[userId];
    const isSaved = list.includes(postId);

    if (isSaved) {
      this.db.savedPosts[userId] = list.filter((id) => id !== postId);
    } else {
      this.db.savedPosts[userId].push(postId);
    }

    const post = this.db.posts.find((p) => p.id === postId);
    if (post) {
      post.isSaved = !isSaved;
    }

    this.schedulePersist();
    return !isSaved;
  }

  public votePoll(postId: string, userId: string, optionId: string): Post {
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post || !post.poll) throw new Error('Poll not found');

    if (post.poll.userVotedId) {
      return post; // Already voted
    }

    const opt = post.poll.options.find((o) => o.id === optionId);
    if (!opt) throw new Error('Option not found');

    opt.votes += 1;
    post.poll.totalVotes += 1;
    post.poll.userVotedId = optionId;

    this.schedulePersist();
    return post;
  }

  // --- Comments ---
  public getComments(postId: string): Comment[] {
    return this.db.comments[postId] || [];
  }

  public addComment(postId: string, authorId: string, content: string, voiceUrl?: string, voiceDuration?: number, parentCommentId?: string): Comment {
    const author = this.getUserById(authorId);
    if (!author) throw new Error('Author not found');
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const now = Date.now();
    const newComment: Comment = {
      id: `comm_${now}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      author,
      content,
      voiceUrl,
      voiceDuration,
      createdAt: 'Just now',
      createdTimestamp: now,
      likesCount: 0,
      isLiked: false,
      likedBy: [],
      parentCommentId,
      replies: [],
    };

    if (!this.db.comments[postId]) {
      this.db.comments[postId] = [];
    }

    if (parentCommentId) {
      const parent = this.db.comments[postId].find((c) => c.id === parentCommentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newComment);
      } else {
        this.db.comments[postId].push(newComment);
      }
    } else {
      this.db.comments[postId].push(newComment);
    }

    post.commentsCount += 1;

    // Send notification to post author or parent comment author
    if (post.author.id !== authorId) {
      this.addNotification({
        type: parentCommentId ? 'reply' : 'comment',
        actor: author,
        title: parentCommentId ? 'replied to your comment' : 'commented on your post',
        previewText: content.substring(0, 70),
        targetType: 'post',
        targetId: post.id,
      });
    }

    this.schedulePersist();
    return newComment;
  }

  public deleteComment(arg1: string, arg2: string, arg3?: string, parentCommentId?: string): boolean {
    let postId: string | undefined;
    let commentId: string;
    let userId: string;

    if (arg3 !== undefined) {
      postId = arg1;
      commentId = arg2;
      userId = arg3;
    } else {
      commentId = arg1;
      userId = arg2;
      for (const pId of Object.keys(this.db.comments)) {
        const found = this.db.comments[pId].some(
          (c) => c.id === commentId || c.replies?.some((r) => r.id === commentId)
        );
        if (found) {
          postId = pId;
          break;
        }
      }
    }

    if (!postId) return false;
    const list = this.db.comments[postId];
    if (!list) return false;

    if (parentCommentId) {
      const parent = list.find((c) => c.id === parentCommentId);
      if (parent && parent.replies) {
        parent.replies = parent.replies.filter((r) => r.id !== commentId);
      }
    } else {
      this.db.comments[postId] = list.filter((c) => c.id !== commentId);
    }

    const post = this.db.posts.find((p) => p.id === postId);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
    }

    this.schedulePersist();
    return true;
  }

  public toggleLikeComment(arg1: string, arg2: string, arg3?: string): boolean {
    let postId: string | undefined;
    let commentId: string;
    let userId: string;

    if (arg3 !== undefined) {
      postId = arg1;
      commentId = arg2;
      userId = arg3;
    } else {
      commentId = arg1;
      userId = arg2;
      for (const pId of Object.keys(this.db.comments)) {
        const found = this.db.comments[pId].some(
          (c) => c.id === commentId || c.replies?.some((r) => r.id === commentId)
        );
        if (found) {
          postId = pId;
          break;
        }
      }
    }

    if (!postId) return false;
    const list = this.db.comments[postId];
    if (!list) return false;

    let targetComment: Comment | undefined = list.find((c) => c.id === commentId);
    if (!targetComment) {
      for (const c of list) {
        if (c.replies) {
          const found = c.replies.find((r) => r.id === commentId);
          if (found) {
            targetComment = found;
            break;
          }
        }
      }
    }

    if (!targetComment) return false;

    if (!targetComment.likedBy) targetComment.likedBy = [];
    const isLiked = targetComment.likedBy.includes(userId);

    if (isLiked) {
      targetComment.likedBy = targetComment.likedBy.filter((id) => id !== userId);
      targetComment.likesCount = Math.max(0, targetComment.likesCount - 1);
      targetComment.isLiked = false;
    } else {
      targetComment.likedBy.push(userId);
      targetComment.likesCount += 1;
      targetComment.isLiked = true;
    }

    this.schedulePersist();
    return !isLiked;
  }

  // --- Stories ---
  public getStories(): Story[] {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return this.db.stories.filter((s) => s.createdTimestamp > cutoff);
  }

  public createStory(
    userId: string,
    mediaType: 'photo' | 'video' | 'text',
    mediaUrl: string,
    caption?: string,
    textContent?: string,
    bgColor?: string,
    audience: 'everyone' | 'followers' | 'close-friends' = 'everyone',
    storyThumbnail?: string
  ): Story {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const now = Date.now();
    const newStory: Story = {
      id: `story_${now}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userHandle: user.handle,
      userAvatar: user.avatar,
      storyThumbnail: storyThumbnail || (mediaType === 'photo' ? mediaUrl : undefined),
      mediaType,
      mediaUrl,
      caption,
      textContent,
      bgColor,
      createdAt: 'Just now',
      createdTimestamp: now,
      expiresInHours: 24,
      audience,
      viewers: [],
      reactions: [],
      comments: [],
    };

    this.db.stories.unshift(newStory);
    this.schedulePersist();
    return newStory;
  }

  public markStoryViewed(storyId: string, viewerId: string): void {
    const story = this.db.stories.find((s) => s.id === storyId);
    if (!story) return;

    const viewer = this.getUserById(viewerId);
    if (!viewer) return;

    if (!story.viewers.some((v) => v.userId === viewerId)) {
      story.viewers.push({
        userId: viewer.id,
        userName: viewer.name,
        userHandle: viewer.handle,
        userAvatar: viewer.avatar,
        viewedAt: 'Just now',
      });
      this.schedulePersist();
    }
  }

  public reactToStory(storyId: string, userId: string, emoji: string): void {
    const story = this.db.stories.find((s) => s.id === storyId);
    if (!story) return;

    const user = this.getUserById(userId);
    if (!user) return;

    story.reactions.push({
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      emoji,
      timestamp: 'Just now',
    });

    if (story.userId !== userId) {
      this.addNotification({
        type: 'story_reaction',
        actor: user,
        title: `reacted with ${emoji} to your story`,
        targetType: 'story',
        targetId: story.id,
      });
    }

    this.schedulePersist();
  }

  public reactStory(storyId: string, userId: string, emoji: string): void {
    return this.reactToStory(storyId, userId, emoji);
  }

  public addStoryComment(storyId: string, userId: string, text?: string, voiceUrl?: string, voiceDuration?: number): void {
    const story = this.db.stories.find((s) => s.id === storyId);
    if (!story) return;

    const user = this.getUserById(userId);
    if (!user) return;

    if (!story.comments) story.comments = [];
    const now = Date.now();

    story.comments.push({
      id: `scomm_${now}`,
      storyId,
      author: user,
      text,
      voiceUrl,
      voiceDuration,
      createdAt: 'Just now',
      createdTimestamp: now,
    });

    if (story.userId !== userId) {
      this.addNotification({
        type: 'story_reply',
        actor: user,
        title: `replied to your story`,
        previewText: text || 'Voice note',
        targetType: 'story',
        targetId: story.id,
      });
    }

    this.schedulePersist();
  }

  public deleteStory(storyId: string, userId: string): boolean {
    const story = this.db.stories.find((s) => s.id === storyId);
    if (!story) return false;

    if (story.userId !== userId && userId !== 'user_main') {
      throw new Error('Unauthorized to delete story');
    }

    this.db.stories = this.db.stories.filter((s) => s.id !== storyId);
    this.schedulePersist();
    return true;
  }

  // --- Conversations & Messages ---
  private removeExpiredMessages(conversation: Conversation): boolean {
    const before = conversation.messages.length;
    const now = Date.now();
    conversation.messages = conversation.messages.filter((message) => !message.expiresAt || message.expiresAt > now);
    if (conversation.pinnedMessage?.expiresAt && conversation.pinnedMessage.expiresAt <= now) {
      conversation.pinnedMessage = undefined;
    }
    return conversation.messages.length !== before;
  }

  public getConversations(userId: string): Conversation[] {
    let changed = false;
    const conversations = this.db.conversations.filter((c) => c.participants.some((p) => p.id === userId));
    conversations.forEach((conversation) => { if (this.removeExpiredMessages(conversation)) changed = true; });
    if (changed) this.schedulePersist();
    return conversations;
  }

  public getMessages(conversationId: string): Message[] {
    const conv = this.db.conversations.find((c) => c.id === conversationId);
    if (!conv) return [];
    if (this.removeExpiredMessages(conv)) this.schedulePersist();
    return conv.messages;
  }

  public setDisappearingMessages(conversationId: string, userId: string, seconds: number): Conversation {
    const conversation = this.db.conversations.find((item) => item.id === conversationId);
    if (!conversation || !conversation.participants.some((participant) => participant.id === userId)) {
      throw new Error('Conversation not found');
    }
    const allowed = [0, 86400, 604800, 7776000];
    if (!allowed.includes(seconds)) throw new Error('Unsupported disappearing-message duration');
    conversation.disappearingMessagesSeconds = seconds;
    this.schedulePersist();
    return conversation;
  }

  public sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    voiceUrlOrMedia?: string,
    audioDuration?: number,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'file'
  ): Message {
    let conversation = this.db.conversations.find((c) => c.id === conversationId);
    const sender = this.getUserById(senderId);
    if (!sender) throw new Error('Sender not found');

    const effectiveMediaUrl = mediaUrl || voiceUrlOrMedia;
    const now = Date.now();
    const message: Message = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      text: text || '',
      mediaUrl: effectiveMediaUrl,
      mediaType,
      audioDuration,
      createdAt: 'Just now',
      isRead: false,
      expiresAt: conversation?.disappearingMessagesSeconds
        ? now + conversation.disappearingMessagesSeconds * 1000
        : undefined,
    };

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.messages.push(message);
    conversation.lastMessageTime = 'Just now';
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;

    this.schedulePersist();
    return message;
  }

  public createConversation(
    participantsOrCurrentUserId: string[] | string,
    recipientIdOrInitialMessage?: string,
    optionalInitialMessage?: string
  ): Conversation {
    let currentUserId: string;
    let recipientId: string;
    let initialMessage: string | undefined;

    if (Array.isArray(participantsOrCurrentUserId)) {
      currentUserId = participantsOrCurrentUserId[0];
      recipientId = participantsOrCurrentUserId[1];
      initialMessage = recipientIdOrInitialMessage;
    } else {
      currentUserId = participantsOrCurrentUserId;
      recipientId = recipientIdOrInitialMessage as string;
      initialMessage = optionalInitialMessage;
    }

    const currentUser = this.getUserById(currentUserId);
    const recipient = this.getUserById(recipientId);
    if (!currentUser || !recipient) throw new Error('Users not found');

    // Check if 1:1 conversation already exists
    let existing = this.db.conversations.find(
      (c) =>
        !c.isGroup &&
        c.participants.some((p) => p.id === currentUserId) &&
        c.participants.some((p) => p.id === recipientId)
    );

    if (existing) {
      if (initialMessage) {
        this.sendMessage(existing.id, currentUserId, initialMessage);
      }
      return existing;
    }

    const now = Date.now();
    const newConv: Conversation = {
      id: `conv_${now}_${Math.random().toString(36).substring(2, 6)}`,
      title: recipient.name,
      isGroup: false,
      avatar: recipient.avatar,
      participants: [currentUser, recipient],
      messages: [],
      unreadCount: 0,
      lastMessageTime: 'Just now',
    };

    if (initialMessage) {
      newConv.messages.push({
        id: `msg_${now}`,
        senderId: currentUserId,
        text: initialMessage,
        createdAt: 'Just now',
        isRead: false,
      });
    }

    this.db.conversations.unshift(newConv);
    this.schedulePersist();
    return newConv;
  }

  public createGroupConversation(creatorId: string, participantIds: string[], title: string, initialMessage?: string): Conversation {
    const uniqueIds = Array.from(new Set([creatorId, ...participantIds].filter(Boolean)));
    if (uniqueIds.length < 3) throw new Error('Choose at least two other members for a group chat.');
    const participants = uniqueIds.map((id) => this.getUserById(id));
    if (participants.some((user) => !user)) throw new Error('One or more selected members could not be found.');
    const creator = this.getUserById(creatorId);
    if (!creator) throw new Error('Group creator could not be found.');
    const now = Date.now();
    const conversation: Conversation = {
      id: `group_${now}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim() || 'New Group',
      isGroup: true,
      avatar: '',
      participants: participants as User[],
      messages: [],
      unreadCount: 0,
      lastMessageTime: 'Just now',
      disappearingMessagesSeconds: 0,
    };
    if (initialMessage?.trim()) {
      conversation.messages.push({
        id: `msg_${now}`,
        senderId: creatorId,
        text: initialMessage.trim(),
        createdAt: 'Just now',
        isRead: false,
      });
    }
    this.db.conversations.unshift(conversation);
    this.schedulePersist();
    return conversation;
  }

  public markConversationRead(conversationId: string, _userId?: string): void {
    const conv = this.db.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      conv.messages.forEach((m) => (m.isRead = true));
      this.schedulePersist();
    }
  }

  public togglePinMessage(conversationId: string, messageId: string): void {
    const conv = this.db.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return;

    if (conv.pinnedMessage?.id === messageId) {
      conv.pinnedMessage = undefined;
      msg.isPinned = false;
    } else {
      conv.pinnedMessage = msg;
      msg.isPinned = true;
    }
    this.schedulePersist();
  }

  public reactToMessage(conversationId: string, messageId: string, emoji: string): void {
    const conv = this.db.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return;

    msg.reaction = msg.reaction === emoji ? undefined : emoji;
    this.schedulePersist();
  }

  // --- Notifications ---
  public addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): NotificationItem {
    const now = Date.now();
    const notif: NotificationItem = {
      ...item,
      id: `notif_${now}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
      isRead: false,
    };
    this.db.notifications.unshift(notif);
    this.schedulePersist();
    return notif;
  }

  public getNotifications(userId?: string): NotificationItem[] {
    if (!userId) return this.db.notifications;
    return this.db.notifications.filter(
      (n) => (n as any).recipientId === userId || !((n as any).recipientId) || n.actor.id !== userId
    );
  }

  public markNotificationRead(id: string): void {
    const notif = this.db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.schedulePersist();
    }
  }

  public markAllNotificationsRead(userId?: string): number {
    let count = 0;
    this.db.notifications.forEach((n) => {
      if (!userId || (n as any).recipientId === userId || !((n as any).recipientId)) {
        if (!n.isRead) {
          n.isRead = true;
          count++;
        }
      }
    });
    this.schedulePersist();
    return count;
  }

  // --- Settings ---
  public getSettings(userId: string): UserSettings {
    return this.db.settings[userId] || INITIAL_SETTINGS;
  }

  public updateSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    const current = this.db.settings[userId] || INITIAL_SETTINGS;
    const updated: UserSettings = {
      ...current,
      ...updates,
      account: { ...current.account, ...(updates.account || {}) },
      privacy: { ...current.privacy, ...(updates.privacy || {}) },
      appearance: { ...current.appearance, ...(updates.appearance || {}) },
      notifications: { ...current.notifications, ...(updates.notifications || {}) },
      dataAndStorage: { ...current.dataAndStorage, ...(updates.dataAndStorage || {}) },
      accessibility: { ...current.accessibility, ...(updates.accessibility || {}) },
      contentPreferences: { ...current.contentPreferences, ...(updates.contentPreferences || {}) },
      aiPreferences: { ...current.aiPreferences, ...(updates.aiPreferences || {}) },
      language: { ...current.language, ...(updates.language || {}) },
    };

    this.db.settings[userId] = updated;
    this.schedulePersist();
    return updated;
  }

  // --- Reporting & Moderation ---
  public submitReport(targetType: 'post' | 'user' | 'message' | 'listing', targetId: string, reason: string, reporterHandle: string): ReportedItem {
    const now = Date.now();
    const report: ReportedItem = {
      id: `rep_${now}_${Math.random().toString(36).substring(2, 6)}`,
      targetType,
      targetId,
      reason,
      reporterHandle,
      timestamp: 'Just now',
      status: 'pending',
    };
    this.db.reportedItems.unshift(report);
    this.schedulePersist();
    return report;
  }

  public getReports(): ReportedItem[] {
    return this.db.reportedItems;
  }

  public resolveReport(reportId: string, action: 'resolve' | 'dismiss' | 'delete_content'): boolean {
    const report = this.db.reportedItems.find((r) => r.id === reportId);
    if (!report) return false;

    if (action === 'delete_content') {
      if (report.targetType === 'post') {
        this.db.posts = this.db.posts.filter((p) => p.id !== report.targetId);
        delete this.db.comments[report.targetId];
      } else if (report.targetType === 'listing') {
        this.db.marketplaceListings = this.db.marketplaceListings.filter((l) => l.id !== report.targetId);
      }
      report.status = 'resolved';
    } else if (action === 'resolve') {
      report.status = 'resolved';
    } else {
      report.status = 'dismissed';
    }

    this.schedulePersist();
    return true;
  }

  // --- Creator store products ---
  public createProduct(ownerId: string, data: Omit<Product, 'id' | 'salesCount' | 'rating'>): Product {
    const owner = this.getUserById(ownerId);
    if (!owner) throw new Error('Please sign in before adding a store item.');
    const product: Product = {
      ...data,
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ownerId,
      salesCount: 0,
      rating: 5,
    };
    this.db.products = this.db.products || [];
    this.db.products.unshift(product);
    this.schedulePersist();
    return product;
  }

  // --- Marketplace ---
  public createListing(sellerId: string, data: Omit<MarketplaceListing, 'id' | 'seller' | 'status' | 'createdAt' | 'createdTimestamp' | 'viewsCount' | 'sharesCount' | 'isSaved'>): MarketplaceListing {
    const seller = this.getUserById(sellerId);
    if (!seller) throw new Error('Seller not found');

    const now = Date.now();
    const listing: MarketplaceListing = {
      ...data,
      id: `list_${now}_${Math.random().toString(36).substring(2, 6)}`,
      seller,
      status: 'available',
      createdAt: 'Just now',
      createdTimestamp: now,
      viewsCount: 1,
      sharesCount: 0,
      isSaved: false,
    };

    this.db.marketplaceListings.unshift(listing);
    this.schedulePersist();
    return listing;
  }

  public updateListing(id: string, updates: Partial<MarketplaceListing>): MarketplaceListing {
    const index = this.db.marketplaceListings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Listing not found');

    const updated = { ...this.db.marketplaceListings[index], ...updates };
    this.db.marketplaceListings[index] = updated;
    this.schedulePersist();
    return updated;
  }

  public deleteListing(id: string): boolean {
    this.db.marketplaceListings = this.db.marketplaceListings.filter((l) => l.id !== id);
    this.schedulePersist();
    return true;
  }

  // --- Marketplace Stores ---
  public getStores(): MarketplaceStore[] {
    return (this.db.marketplaceStores || []).map((store) => ({ ...store, owner: this.getUserById(store.ownerId) || store.owner }));
  }

  public createStore(ownerId: string, input: { name: string; description: string; category: string; location: string; logoUrl?: string; coverUrl?: string }): MarketplaceStore {
    const owner = this.getUserById(ownerId);
    if (!owner) throw new Error('Please sign in before creating a store.');
    const name = String(input.name || '').trim();
    if (name.length < 3 || name.length > 60) throw new Error('Store name must be between 3 and 60 characters.');
    if (!String(input.category || '').trim()) throw new Error('Choose a store category.');
    if (!String(input.description || '').trim()) throw new Error('Add a short store description.');
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    const store: MarketplaceStore = {
      id: `store_${now}_${Math.random().toString(36).slice(2, 7)}`,
      ownerId, owner, name, slug,
      description: String(input.description).trim().slice(0, 600),
      category: String(input.category).trim(),
      location: String(input.location || '').trim().slice(0, 120),
      logoUrl: input.logoUrl, coverUrl: input.coverUrl,
      followers: [], createdAt: new Date(now).toISOString(), createdTimestamp: now,
    };
    this.db.marketplaceStores = this.db.marketplaceStores || [];
    this.db.marketplaceStores.unshift(store);
    this.schedulePersist();
    return store;
  }

  public updateStore(storeId: string, ownerId: string, updates: Partial<Pick<MarketplaceStore, 'name' | 'description' | 'category' | 'location' | 'logoUrl' | 'coverUrl'>>): MarketplaceStore {
    const stores = this.db.marketplaceStores || [];
    const index = stores.findIndex((store) => store.id === storeId);
    if (index < 0) throw new Error('Store not found.');
    if (stores[index].ownerId !== ownerId) throw new Error('You can only edit your own store.');
    const allowed: any = {};
    for (const key of ['name', 'description', 'category', 'location', 'logoUrl', 'coverUrl']) {
      if ((updates as any)[key] !== undefined) allowed[key] = (updates as any)[key];
    }
    const updated = { ...stores[index], ...allowed };
    stores[index] = updated;
    this.schedulePersist();
    return { ...updated, owner: this.getUserById(ownerId) || updated.owner };
  }

  public toggleStoreFollow(storeId: string, userId: string): boolean {
    const stores = this.db.marketplaceStores || [];
    const store = stores.find((item) => item.id === storeId);
    if (!store) throw new Error('Store not found.');
    const followers = new Set(store.followers || []);
    const following = followers.has(userId);
    if (following) followers.delete(userId); else followers.add(userId);
    store.followers = Array.from(followers);
    this.schedulePersist();
    return !following;
  }

  // --- Communities ---
  public createCommunity(data: Partial<Community> & { name: string; description: string; ownerId?: string }): Community {
    const now = Date.now();
    const ownerId = data.ownerId || (data as any).createdBy;
    const newCommunity: Community = {
      ...data,
      id: `comm_${now}_${Math.random().toString(36).substring(2, 6)}`,
      type: data.type || 'community',
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: data.description,
      avatar: data.avatar || '',
      coverImage: data.coverImage || '',
      category: data.category || 'General',
      ownerId,
      owner: (ownerId ? this.getUserById(ownerId) : undefined) || data.owner,
      membersCount: Math.max(1, Number(data.membersCount) || 1),
      isJoined: true,
      isPrivate: !!data.isPrivate,
      discoverability: data.discoverability || 'visible',
      whoCanJoin: data.whoCanJoin || 'anyone',
      rules: data.rules || [
        'Be respectful and foster constructive creative feedback.',
        'No uncredited media or unauthorized commercial spam.',
      ],
      channels: data.channels || ['general', 'announcements'],
      activeChannel: data.activeChannel || 'general',
      createdAt: new Date(now).toISOString(),
    };

    this.db.communities.unshift(newCommunity);
    this.schedulePersist();
    return newCommunity;
  }

  public updateCommunity(communityId: string, ownerId: string, updates: Partial<Community>): Community {
    const index = this.db.communities.findIndex((community) => community.id === communityId);
    if (index < 0) throw new Error('Community not found.');
    const existing = this.db.communities[index];
    if (existing.ownerId !== ownerId) throw new Error('Only the community owner can update this space.');
    const updated: Community = { ...existing, ...updates, id: existing.id, ownerId: existing.ownerId };
    this.db.communities[index] = updated;
    this.schedulePersist();
    return updated;
  }

  public deleteCommunity(communityId: string, ownerId: string): boolean {
    const existing = this.db.communities.find((community) => community.id === communityId);
    if (!existing) return false;
    if (existing.ownerId !== ownerId) throw new Error('Only the community owner can delete this space.');
    this.db.communities = this.db.communities.filter((community) => community.id !== communityId);
    this.schedulePersist();
    return true;
  }

  public joinCommunity(communityId: string, userId: string): boolean {
    const comm = this.db.communities.find((c) => c.id === communityId);
    const user = this.getUserById(userId);
    if (!comm || !user) throw new Error('Community or member not found.');
    comm.memberList = comm.memberList || [];
    if (!comm.memberList.some((member) => member.user.id === userId)) {
      comm.memberList.push({ user, role: 'member', joinedDate: new Date().toISOString() });
    }
    comm.membersCount = Math.max(1, comm.memberList.length);
    this.schedulePersist();
    return true;
  }

  public leaveCommunity(communityId: string, userId: string): boolean {
    const comm = this.db.communities.find((c) => c.id === communityId);
    if (!comm) throw new Error('Community not found.');
    if (comm.ownerId === userId) throw new Error('The owner cannot leave their own community. Transfer ownership or delete the space instead.');
    comm.memberList = (comm.memberList || []).filter((member) => member.user.id !== userId);
    comm.membersCount = Math.max(1, comm.memberList.length);
    this.schedulePersist();
    return true;
  }

  // --- Authentication & User Accounts ---
  public registerUser(params: {
    name: string;
    handle: string;
    email: string;
    password: string;
    bio?: string;
    avatar?: string;
  }): { user: User; token: string } {
    const cleanHandle = params.handle.trim().replace(/^@/, '').toLowerCase();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim();

    if (!cleanHandle || cleanHandle.length < 3 || cleanHandle.length > 25) {
      throw new Error('Username must be between 3 and 25 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanHandle)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address');
    }
    if (!params.password || params.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check handle uniqueness
    const existingHandle = this.db.users.find((u) => u.handle.toLowerCase() === cleanHandle);
    if (existingHandle) {
      throw new Error(`The handle @${cleanHandle} is already registered`);
    }

    if (this.db.userCredentials) {
      const emailTaken = Object.values(this.db.userCredentials).some(
        (c) => c.email.toLowerCase() === cleanEmail
      );
      if (emailTaken) {
        throw new Error('An account with this email address already exists');
      }
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHmac('sha256', salt).update(params.password).digest('hex');

    const newUser: User = {
      id: userId,
      name: cleanName,
      handle: cleanHandle,
      avatar: params.avatar || '',
      banner: '',
      bio: params.bio?.trim() || 'New member of the Gistupp connected social network. 🌸',
      website: '',
      location: '',
      joinedDate: 'Joined recently',
      verified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isPrivate: false,
      followers: [],
      following: [],
    };

    if (!this.db.userCredentials) this.db.userCredentials = {};
    this.db.userCredentials[userId] = {
      email: cleanEmail,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    this.db.users.push(newUser);

    // Initial settings
    this.db.settings[userId] = {
      ...INITIAL_SETTINGS,
      account: {
        ...INITIAL_SETTINGS.account,
        email: cleanEmail,
      },
    };

    // Issue session token (30 days validity)
    const token = `rose_${crypto.randomBytes(24).toString('hex')}`;
    if (!this.db.sessions) this.db.sessions = {};
    this.db.sessions[token] = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    this.schedulePersist();
    return { user: newUser, token };
  }

  public loginUser(handleOrEmail: string, password: string): { user: User; token: string } {
    const query = handleOrEmail.trim().replace(/^@/, '').toLowerCase();
    if (!query || !password) {
      throw new Error('Please enter username/email and password');
    }

    let user = this.db.users.find(
      (u) => u.handle.toLowerCase() === query || (u as any).email?.toLowerCase() === query
    );

    if (!user && this.db.userCredentials) {
      const matchUserId = Object.keys(this.db.userCredentials).find(
        (id) => this.db.userCredentials![id].email.toLowerCase() === query
      );
      if (matchUserId) {
        user = this.getUserById(matchUserId);
      }
    }

    if (!user) {
      throw new Error('Invalid username/email or password');
    }

    if (!this.db.userCredentials) this.db.userCredentials = {};
    const creds = this.db.userCredentials[user.id];

    if (creds) {
      const hash = crypto.createHmac('sha256', creds.salt).update(password).digest('hex');
      if (hash !== creds.passwordHash) {
        throw new Error('Invalid username/email or password');
      }
    }

    const token = `rose_${crypto.randomBytes(24).toString('hex')}`;
    if (!this.db.sessions) this.db.sessions = {};
    this.db.sessions[token] = {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    this.schedulePersist();
    return { user, token };
  }

  public getUserBySession(token: string): User | undefined {
    if (!token || !this.db.sessions) return undefined;
    const session = this.db.sessions[token];
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      delete this.db.sessions[token];
      return undefined;
    }
    return this.getUserById(session.userId);
  }

  public logoutUser(token: string): boolean {
    if (this.db.sessions && this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.schedulePersist();
      return true;
    }
    return false;
  }
}

export const storage = new PersistentStorage();
