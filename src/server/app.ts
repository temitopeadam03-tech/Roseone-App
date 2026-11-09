import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { storage } from './storage';
import { createClient } from '@supabase/supabase-js';
import { AccessToken } from 'livekit-server-sdk';

export function createExpressApp() {
  const app = express();

  // Hydrate the shared database before authentication or API handlers can
  // read/write state. This makes every device use the same durable snapshot.
  app.use(async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      await storage.initializeDurable();
      next();
    } catch (error) {
      console.error('[storage] Durable database initialization failed:', error);
      next(error);
    }
  });

  // Do not acknowledge a write until the shared Supabase snapshot is durable.
  // This closes the previous 150ms window in which a restart could lose a post/message.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const originalEnd = res.end.bind(res);
    let endStarted = false;
    (res as any).end = (...args: any[]) => {
      if (endStarted) return res;
      endStarted = true;
      void storage.flushDurable().then(() => {
        originalEnd(...args);
      }).catch((error) => {
        console.error('[storage] Refusing to acknowledge an unpersisted change:', error);
        if (!res.headersSent) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          originalEnd(JSON.stringify({ success: false, error: 'Your change could not be saved. Please retry.' }));
        } else {
          originalEnd(...args);
        }
      });
      return res;
    };
    next();
  });

  // Handle Netlify Functions path rewriting if invoked via /.netlify/functions/api
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url.startsWith('/.netlify/functions/api')) {
      req.url = req.url.replace('/.netlify/functions/api', '/api') || '/';
    }
    next();
  });

  // CORS headers for custom domain and SPA origins
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Safe uploads directory detection
  const isServerless = !!(
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL ||
    process.env.LAMBDA_TASK_ROOT
  );

  const uploadsDir = isServerless
    ? path.join('/tmp', 'uploads')
    : path.join(process.cwd(), 'public', 'uploads');

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Notice: upload directory is read-only or deferred:', err);
  }

  // Parse JSON payloads (up to 30mb to accommodate base64 image/audio uploads safely)
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Static uploads serving with caching
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '7d',
      immutable: true,
    })
  );

  // --- Supabase token verification ---
  // Supabase Auth is the source of truth for browser bearer tokens. The API
  // never trusts x-user-id or IDs supplied in request bodies as identity.
  type AuthenticatedUser = {
    id: string; name: string; handle: string; avatar: string; banner: string;
    bio: string; joinedDate: string; verified: boolean; followersCount: number;
    followingCount: number; postsCount: number; isPrivate: boolean;
    followers: string[]; following: string[];
  };
  const authUsers = new WeakMap<Request, AuthenticatedUser>();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  app.use(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
      if (token && supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const auth = await response.json() as { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string };
          const metadata = auth.user_metadata || {};
          const name = String(metadata.name || metadata.full_name || auth.email?.split('@')[0] || 'Gistupp member');
          const handle = String(metadata.handle || auth.email?.split('@')[0] || `member_${auth.id.slice(0, 8)}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 25);
          const profile = storage.upsertSupabaseUser({
            id: auth.id, name, handle, avatar: String(metadata.avatar_url || ''), banner: '',
            bio: String(metadata.bio || ''), joinedDate: auth.created_at || new Date().toISOString(),
            verified: false, followersCount: 0, followingCount: 0, postsCount: 0,
            isPrivate: false, followers: [], following: [],
          });
          authUsers.set(req, profile as AuthenticatedUser);
        }
      }
      next();
    } catch (error) {
      console.error('Supabase token verification failed:', error);
      next();
    }
  });

  const getAuthUser = (req: Request) => {
    const supabaseUser = authUsers.get(req);
    if (supabaseUser) return supabaseUser as any;
    // Temporary compatibility for accounts created before Supabase Auth
    // migration. This accepts only opaque server-issued tokens, never user IDs.
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    return token.startsWith('rose_') ? storage.getUserBySession(token) : undefined;
  };

  // Enforce one authenticated identity for every state-changing API request.
  // This prevents a signed-in member from submitting another member's ID.
  const identityFields = new Set([
    'userId', 'currentUserId', 'authorId', 'senderId', 'sellerId',
    'reporterId', 'actorId', 'ownerId', 'createdBy', 'profileUserId',
  ]);
  const findIdentityMismatch = (value: unknown, authenticatedId: string, depth = 0): string | null => {
    if (!value || typeof value !== 'object' || depth > 6) return null;
    if (Array.isArray(value)) {
      for (const item of value) {
        const mismatch = findIdentityMismatch(item, authenticatedId, depth + 1);
        if (mismatch) return mismatch;
      }
      return null;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (identityFields.has(key) && nested != null && String(nested) !== authenticatedId) return key;
      const mismatch = findIdentityMismatch(nested, authenticatedId, depth + 1);
      if (mismatch) return mismatch;
    }
    return null;
  };

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.path === '/auth/register' || req.path === '/auth/login') return next();
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const mismatch = findIdentityMismatch(req.body, user.id);
    if (mismatch) {
      res.status(403).json({ success: false, error: `The ${mismatch} does not match the authenticated account` });
      return;
    }
    if (req.method === 'PUT' && /^\/users\/[^/]+$/.test(req.path) && req.path.split('/')[2] !== user.id) {
      res.status(403).json({ success: false, error: 'You can only update your own profile' });
      return;
    }
    next();
  });

  // --- LiveKit + Supabase Live service ---
  const adminSupabaseUrl = process.env.SUPABASE_URL;
  const adminSupabaseKey = process.env.SUPABASE_SECRET_KEY;
  const liveDb = adminSupabaseUrl && adminSupabaseKey
    ? createClient(adminSupabaseUrl, adminSupabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  const liveKitUrl = process.env.LIVEKIT_URL;
  const liveKitApiKey = process.env.LIVEKIT_API_KEY;
  const liveKitApiSecret = process.env.LIVEKIT_API_SECRET;

  const makeLiveToken = async (identity: string, name: string, room: string, canPublish: boolean) => {
    if (!liveKitApiKey || !liveKitApiSecret || !liveKitUrl) throw new Error('Live streaming is not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Netlify.');
    const token = new AccessToken(liveKitApiKey, liveKitApiSecret, { identity, name, ttl: '2h' });
    token.addGrant({ roomJoin: true, room, canPublish, canSubscribe: true, canPublishData: true });
    return token.toJwt();
  };

  app.get('/api/live/sessions', async (req: Request, res: Response) => {
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    try {
      const columns = 'id,host_id,title,category,visibility,status,viewer_count,peak_viewers,started_at,created_at';
      const { data: publicSessions, error: publicError } = await liveDb.from('roseone_live_sessions')
        .select(columns).eq('status', 'live').eq('visibility', 'public')
        .order('started_at', { ascending: false }).limit(40);
      if (publicError) throw publicError;
      let followedHostIds: string[] = [];
      const viewer = getAuthUser(req);
      if (viewer) {
        const { data: follows, error: followError } = await liveDb.from('roseone_follows')
          .select('following_id').eq('follower_id', viewer.id).eq('status', 'accepted');
        if (followError) throw followError;
        followedHostIds = (follows || []).map((row: any) => row.following_id).filter(Boolean);
      }
      let followerSessions: any[] = [];
      if (followedHostIds.length) {
        const { data, error } = await liveDb.from('roseone_live_sessions').select(columns)
          .eq('status', 'live').eq('visibility', 'followers').in('host_id', followedHostIds)
          .order('started_at', { ascending: false }).limit(40);
        if (error) throw error;
        followerSessions = data || [];
      }
      const sessions = [...(publicSessions || []), ...followerSessions]
        .filter((session, index, all) => all.findIndex(item => item.id === session.id) === index)
        .sort((a, b) => new Date(b.started_at || b.created_at).getTime() - new Date(a.started_at || a.created_at).getTime())
        .slice(0, 40);
      res.json({ success: true, sessions });
    } catch (error) {
      console.error('Live discovery failed:', error);
      res.status(500).json({ success: false, error: 'Could not load live sessions.' });
    }
  });

  app.post('/api/live/start', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    try {
      const title = String(req.body?.title || '').trim().slice(0, 90);
      const category = String(req.body?.category || 'Just Chatting').slice(0, 40);
      const visibility = req.body?.visibility === 'followers' ? 'followers' : 'public';
      if (title.length < 3) return res.status(400).json({ success: false, error: 'Live title must be at least 3 characters.' });
      const roomName = `gistupp-${crypto.randomUUID()}`;
      const { data, error } = await liveDb.from('roseone_live_sessions').insert({ host_id: user.id, room_name: roomName, title, category, visibility, status: 'scheduled' }).select('id,room_name,title,category,visibility,status').single();
      if (error || !data) throw error || new Error('Could not create live session.');
      const token = await makeLiveToken(user.id, user.name, roomName, true);
      res.status(201).json({ success: true, session: data, token, serverUrl: liveKitUrl });
    } catch (error) {
      console.error('Live start failed:', error);
      res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Unable to start live session.' });
    }
  });

  app.post('/api/live/:id/publish', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const { data, error } = await liveDb.from('roseone_live_sessions').update({ status: 'live', started_at: new Date().toISOString() }).eq('id', req.params.id).eq('host_id', user.id).eq('status', 'scheduled').select('id').maybeSingle();
    if (error || !data) return res.status(404).json({ success: false, error: 'Could not activate this live session.' });
    res.json({ success: true });
  });

  app.post('/api/live/:id/join', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const { data: session, error } = await liveDb.from('roseone_live_sessions').select('id,host_id,room_name,title,visibility,status').eq('id', req.params.id).maybeSingle();
    if (error || !session || session.status !== 'live') return res.status(404).json({ success: false, error: 'This live session is unavailable.' });
    if (session.visibility === 'followers' && session.host_id !== user.id) {
      const { data: follow } = await liveDb.from('roseone_follows').select('follower_id').eq('follower_id', user.id).eq('following_id', session.host_id).eq('status', 'accepted').maybeSingle();
      if (!follow) return res.status(403).json({ success: false, error: 'Follow this creator to join their live session.' });
    }
    try {
      const token = await makeLiveToken(user.id, user.name, session.room_name, session.host_id === user.id);
      await liveDb.from('roseone_live_viewers').upsert({ session_id: session.id, user_id: user.id, joined_at: new Date().toISOString(), left_at: null });
      const { count } = await liveDb.from('roseone_live_viewers').select('*', { count: 'exact', head: true }).eq('session_id', session.id).is('left_at', null);
      await liveDb.from('roseone_live_sessions').update({ viewer_count: count || 0, peak_viewers: Math.max(count || 0, 0) }).eq('id', session.id);
      res.json({ success: true, session, token, serverUrl: liveKitUrl });
    } catch (e) { res.status(503).json({ success: false, error: e instanceof Error ? e.message : 'Unable to join live session.' }); }
  });

  app.post('/api/live/:id/leave', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const { error } = await liveDb.from('roseone_live_viewers').update({ left_at: new Date().toISOString() }).eq('session_id', req.params.id).eq('user_id', user.id);
    if (error) return res.status(500).json({ success: false, error: 'Could not update viewer presence.' });
    const { count } = await liveDb.from('roseone_live_viewers').select('*', { count: 'exact', head: true }).eq('session_id', req.params.id).is('left_at', null);
    await liveDb.from('roseone_live_sessions').update({ viewer_count: count || 0 }).eq('id', req.params.id);
    res.json({ success: true, viewerCount: count || 0 });
  });

  app.post('/api/live/:id/end', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const { data, error } = await liveDb.from('roseone_live_sessions').update({ status: 'ended', ended_at: new Date().toISOString(), viewer_count: 0 }).eq('id', req.params.id).eq('host_id', user.id).select('id').maybeSingle();
    if (error || !data) return res.status(404).json({ success: false, error: 'Live session not found or not owned by this account.' });
    await liveDb.from('roseone_live_viewers').update({ left_at: new Date().toISOString() }).eq('session_id', req.params.id).is('left_at', null);
    res.json({ success: true });
  });

  app.get('/api/live/wallet', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Wallet service is not configured.' });
    const { data, error } = await liveDb.from('gistupp_coin_wallets').select('balance,lifetime_purchased,lifetime_spent').eq('user_id', user.id).maybeSingle();
    if (error) return res.status(500).json({ success: false, error: 'Could not load wallet.' });
    res.json({ success: true, balance: data?.balance || 0, lifetimePurchased: data?.lifetime_purchased || 0, lifetimeSpent: data?.lifetime_spent || 0 });
  });

  app.get('/api/live/chat-preferences', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const { data, error } = await liveDb.from('gistupp_live_chat_preferences').select('theme,opacity,font_size').eq('user_id', user.id).maybeSingle();
    if (error) return res.status(500).json({ success: false, error: 'Could not load chat preferences.' });
    res.json({ success: true, preferences: data || { theme: 'glass', opacity: 80, font_size: 'normal' } });
  });

  app.put('/api/live/chat-preferences', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const theme = ['glass','midnight','rose','ocean','classic'].includes(req.body?.theme) ? req.body.theme : 'glass';
    const opacity = Math.max(30, Math.min(100, Number(req.body?.opacity) || 80));
    const font_size = ['small','normal','large'].includes(req.body?.fontSize) ? req.body.fontSize : 'normal';
    const { error } = await liveDb.from('gistupp_live_chat_preferences').upsert({ user_id: user.id, theme, opacity, font_size, updated_at: new Date().toISOString() });
    if (error) return res.status(500).json({ success: false, error: 'Could not save chat preferences.' });
    res.json({ success: true });
  });

  app.get('/api/live/:id/chat', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const { data: session } = await liveDb.from('roseone_live_sessions').select('id,host_id,status,visibility').eq('id', req.params.id).maybeSingle();
    if (!session || session.status !== 'live') return res.status(404).json({ success: false, error: 'Live session unavailable.' });
    if (session.visibility === 'followers' && session.host_id !== user.id) {
      const { data: follow } = await liveDb.from('roseone_follows').select('follower_id').eq('follower_id', user.id).eq('following_id', session.host_id).eq('status', 'accepted').maybeSingle();
      if (!follow) return res.status(403).json({ success: false, error: 'This room is for followers.' });
    }
    const { data, error } = await liveDb.from('roseone_live_chat_messages').select('id,sender_id,body,is_pinned,created_at').eq('session_id', req.params.id).is('deleted_at', null).order('created_at', { ascending: true }).limit(100);
    if (error) return res.status(500).json({ success: false, error: 'Could not load live chat.' });
    res.json({ success: true, messages: data || [] });
  });

  app.post('/api/live/:id/chat', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const body = String(req.body?.body || '').trim().slice(0, 500);
    if (!body) return res.status(400).json({ success: false, error: 'Comment cannot be empty.' });
    const { data: session } = await liveDb.from('roseone_live_sessions').select('id,host_id,status,visibility').eq('id', req.params.id).maybeSingle();
    if (!session || session.status !== 'live') return res.status(404).json({ success: false, error: 'Live session unavailable.' });
    if (session.visibility === 'followers' && session.host_id !== user.id) {
      const { data: follow } = await liveDb.from('roseone_follows').select('follower_id').eq('follower_id', user.id).eq('following_id', session.host_id).eq('status', 'accepted').maybeSingle();
      if (!follow) return res.status(403).json({ success: false, error: 'This room is for followers.' });
    }
    const { data, error } = await liveDb.from('roseone_live_chat_messages').insert({ session_id: req.params.id, sender_id: user.id, body }).select('id,sender_id,body,is_pinned,created_at').single();
    if (error) return res.status(400).json({ success: false, error: 'Comment could not be sent.' });
    res.status(201).json({ success: true, message: data });
  });

  app.post('/api/live/:id/gifts', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!liveDb) return res.status(503).json({ success: false, error: 'Live database is not configured.' });
    const giftCode = String(req.body?.giftCode || '').slice(0, 40);
    const quantity = Math.max(1, Math.min(20, Number(req.body?.quantity) || 1));
    const { data, error } = await liveDb.rpc('gistupp_send_live_gift', { p_sender_id: user.id, p_session_id: req.params.id, p_gift_code: giftCode, p_quantity: quantity });
    if (error) return res.status(400).json({ success: false, error: error.message.includes('insufficient') ? 'Your Gistupp wallet does not have enough coins.' : 'Gift could not be delivered.' });
    res.json({ success: true, receipt: data });
  });

  // --- Health Check ---
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Gistupp Backend',
      version: '1.0.0',
      deployment: isServerless ? 'netlify-serverless' : 'standalone-node',
      timestamp: new Date().toISOString(),
    });
  });

  // --- Authentication Routes ---
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, handle, email, password, bio, avatar } = req.body;
      if (!name || !handle || !email || !password) {
        res.status(400).json({ success: false, error: 'Name, handle, email, and password are required' });
        return;
      }
      const result = storage.registerUser({ name, handle, email, password, bio, avatar });
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { handleOrEmail, password } = req.body;
      if (!handleOrEmail || !password) {
        res.status(400).json({ success: false, error: 'Username/email and password are required' });
        return;
      }
      const result = storage.loginUser(handleOrEmail, password);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(401).json({ success: false, error: err.message || 'Invalid credentials' });
    }
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    try {
      const token = (req.headers.authorization?.replace(/^Bearer\s+/, '') || req.headers['x-session-token']) as string;
      if (token) {
        storage.logoutUser(token);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Database snapshot / bootstrap ---
  app.get('/api/bootstrap', async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const userId = authUser.id;
      const data = storage.getBootstrapData(userId);
      // Supabase is the shared source of truth for cross-device Stories and Marketplace listings.
      if (liveDb) {
        const [{ data: sharedStories, error: storiesError }, { data: sharedListings, error: listingsError }] = await Promise.all([
          liveDb.from('gistupp_shared_content').select('payload').eq('content_type', 'story').or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order('created_at', { ascending: false }).limit(500),
          liveDb.from('gistupp_shared_content').select('payload').eq('content_type', 'marketplace_listing').order('created_at', { ascending: false }).limit(1000),
        ]);
        if (storiesError || listingsError) {
          console.error('Shared content read failed:', storiesError || listingsError);
        } else {
          data.stories = (sharedStories || []).map((row: any) => row.payload).filter(Boolean);
          data.marketplaceListings = (sharedListings || []).map((row: any) => row.payload).filter(Boolean);
        }
      }
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error in /api/bootstrap:', err);
      res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  // --- Secure Media Upload ---
  app.post('/api/upload', async (req: Request, res: Response) => {
    try {
      const { dataUrl } = req.body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ success: false, error: 'Missing or invalid dataUrl' });
        return;
      }

      const match = dataUrl.match(/^data:([a-zA-Z0-9\-\.\/\+]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({ success: false, error: 'Malformed base64 data URL' });
        return;
      }

      const mimeType = match[1].toLowerCase();
      const base64Data = match[2];

      const allowedMimes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'audio/webm': 'webm',
        'audio/mp4': 'm4a',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
      };

      const ext = allowedMimes[mimeType];
      if (!ext) {
        res.status(400).json({
          success: false,
          error: `Unsupported file type: ${mimeType}. Permitted: JPEG, PNG, WebP, GIF, SVG, WebM, MP3, MP4, WAV.`,
        });
        return;
      }

      const approxBytes = (base64Data.length * 3) / 4;
      if (approxBytes > 15 * 1024 * 1024) {
        res.status(413).json({
          success: false,
          error: 'File size exceeds maximum permitted limit of 15MB',
        });
        return;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const authUser = getAuthUser(req);
      if (!authUser) {
        res.status(401).json({ success: false, error: 'Sign in before uploading media.' });
        return;
      }
      const uniqueName = `${authUser.id}/${crypto.randomUUID()}.${ext}`;

      // Persist uploads in Supabase Storage so media URLs survive deploys and work on every device.
      if (liveDb) {
        const bucket = mimeType.startsWith('image/') ? 'gistupp-public' : 'gistupp-media';
        const { error: uploadError } = await liveDb.storage.from(bucket).upload(uniqueName, buffer, {
          contentType: mimeType,
          upsert: false,
          cacheControl: '31536000',
        });
        if (uploadError) throw uploadError;
        const publicResult = liveDb.storage.from(bucket).getPublicUrl(uniqueName);
        const url = bucket === 'gistupp-public'
          ? publicResult.data.publicUrl
          : (await liveDb.storage.from(bucket).createSignedUrl(uniqueName, 60 * 60 * 24 * 7)).data?.signedUrl;
        if (!url) throw new Error('Could not create a media URL.');
        res.json({ success: true, url, filename: uniqueName, size: buffer.length, mimeType });
        return;
      }

      // Local-only fallback for development when Supabase service credentials are unavailable.
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);
        const publicUrl = `/uploads/${uniqueName}`;
        res.json({
          success: true,
          url: publicUrl,
          filename: uniqueName,
          size: buffer.length,
          mimeType,
        });
      } catch (writeErr) {
        console.warn('Storage fallback triggered (read-only environment):', writeErr);
        res.json({
          success: true,
          url: dataUrl,
          filename: uniqueName,
          size: buffer.length,
          mimeType,
        });
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      res.status(500).json({ success: false, error: 'Failed to process media upload' });
    }
  });

  // --- Posts & Feed ---
  app.get('/api/posts', (_req: Request, res: Response) => {
    try {
      const posts = storage.getPosts();
      res.json({ success: true, posts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/posts', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { content, media, pollData, tags, communityId } = req.body;
      const authorId = authUser?.id;

      const safeContent = typeof content === 'string' ? content.trim() : '';
      const hasMedia = Array.isArray(media) && media.length > 0;
      const hasPoll = Boolean(
        pollData && typeof pollData.question === 'string' && pollData.question.trim() &&
        Array.isArray(pollData.options) && pollData.options.filter((option: unknown) => typeof option === 'string' && option.trim()).length >= 2
      );

      // A feed post may contain only photos/videos, only a poll, or text.
      // Do not reject valid media-only posts just because content is empty.
      if (!authorId || (!safeContent && !hasMedia && !hasPoll)) {
        res.status(400).json({ success: false, error: 'Add text, media, or a valid poll before publishing.' });
        return;
      }

      const post = storage.createPost(authorId, safeContent, media, pollData, tags, communityId);
      res.status(201).json({ success: true, post });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/posts/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const success = storage.deletePost(id, userId);
      res.json({ success });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message });
    }
  });

  app.post('/api/posts/:id/like', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;

      if (!userId) {
        res.status(400).json({ success: false, error: 'userId is required' });
        return;
      }

      const result = storage.toggleLikePost(id, userId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/posts/:id/react', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const { reactionType } = req.body;
      const userId = authUser?.id;

      if (!userId || !reactionType) {
        res.status(400).json({ success: false, error: 'userId and reactionType required' });
        return;
      }

      const post = storage.setPostReaction(id, userId, reactionType);
      res.json({ success: true, post });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/posts/:id/save', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;

      if (!userId) {
        res.status(400).json({ success: false, error: 'userId is required' });
        return;
      }

      const isSaved = storage.toggleSavePost(id, userId);
      res.json({ success: true, isSaved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/posts/:id/vote', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const { optionId } = req.body;
      const userId = authUser?.id;

      if (!userId || !optionId) {
        res.status(400).json({ success: false, error: 'userId and optionId required' });
        return;
      }

      const post = storage.votePoll(id, optionId, userId);
      res.json({ success: true, post });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Comments & Replies ---
  app.get('/api/posts/:id/comments', (req: Request, res: Response) => {
    try {
      const comments = storage.getComments(req.params.id);
      res.json({ success: true, comments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/posts/:id/comments', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const { content, voiceUrl, voiceDuration, parentCommentId } = req.body;
      const authorId = authUser?.id;

      if (!authorId || (!content && !voiceUrl)) {
        res.status(400).json({ success: false, error: 'authorId and content or voiceUrl required' });
        return;
      }

      const comment = storage.addComment(
        id,
        authorId,
        content || '',
        voiceUrl,
        voiceDuration,
        parentCommentId
      );
      res.status(201).json({ success: true, comment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/comments/:id/like', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;

      if (!userId) {
        res.status(400).json({ success: false, error: 'userId required' });
        return;
      }

      const comment = storage.toggleLikeComment(id, userId);
      res.json({ success: true, comment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/comments/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const success = storage.deleteComment(id, userId);
      res.json({ success });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message });
    }
  });

  // --- Stories ---
  app.get('/api/stories', (_req: Request, res: Response) => {
    try {
      const stories = storage.getStories();
      res.json({ success: true, stories });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/stories', async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { mediaUrl, mediaType, caption, textContent, bgColor, audience, storyThumbnail } = req.body;
      const userId = authUser?.id;
      if (!userId || (!mediaUrl && mediaType !== 'text')) {
        res.status(400).json({ success: false, error: 'Authenticated user and mediaUrl are required' });
        return;
      }
      const story = storage.createStory(userId, mediaType || 'photo', mediaUrl, caption, textContent, bgColor, audience || 'everyone', storyThumbnail);
      if (liveDb) {
        const { error } = await liveDb.from('gistupp_shared_content').upsert({
          content_type: 'story', content_id: story.id, owner_id: userId, payload: story,
          expires_at: new Date(story.createdTimestamp + (story.expiresInHours || 24) * 3600000).toISOString(),
        }, { onConflict: 'content_type,content_id' });
        if (error) throw error;
      }
      res.status(201).json({ success: true, story });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/stories/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const success = storage.deleteStory(id, userId);
      res.json({ success });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message });
    }
  });

  app.post('/api/stories/:id/view', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;
      if (!userId) {
        res.status(400).json({ success: false, error: 'userId required' });
        return;
      }
      storage.markStoryViewed(id, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/stories/:id/react', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const { reaction } = req.body;
      const userId = authUser?.id;

      if (!userId || !reaction) {
        res.status(400).json({ success: false, error: 'userId and reaction required' });
        return;
      }

      storage.reactStory(id, userId, reaction);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Conversations & Real-Time Messaging ---
  app.get('/api/conversations', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const userId = authUser?.id;
      if (!userId) {
        res.status(400).json({ success: false, error: 'userId is required' });
        return;
      }
      const conversations = storage.getConversations(userId);
      res.json({ success: true, conversations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/conversations', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { participantIds, initialMessage } = req.body;
      const allParticipants = authUser?.id
        ? Array.from(new Set([authUser.id, ...(participantIds || [])]))
        : participantIds;

      if (!allParticipants || allParticipants.length < 2) {
        res.status(400).json({ success: false, error: 'At least 2 participantIds required' });
        return;
      }
      const conversation = storage.createConversation(allParticipants, initialMessage);
      res.status(201).json({ success: true, conversation });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/conversations/group', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const participantIds = Array.isArray(req.body?.participantIds)
        ? req.body.participantIds.map((id: unknown) => String(id)).filter(Boolean)
        : [];
      const title = String(req.body?.title || '').trim();
      const initialMessage = String(req.body?.initialMessage || '');
      const conversation = storage.createGroupConversation(authUser.id, participantIds, title, initialMessage);
      res.status(201).json({ success: true, conversation });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not create group chat.' });
    }
  });

  app.get('/api/conversations/:id/messages', (req: Request, res: Response) => {
    try {
      const messages = storage.getMessages(req.params.id);
      res.json({ success: true, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/conversations/:id/messages', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const { text, voiceUrl, voiceDuration, mediaUrl, mediaType } = req.body;
      const senderId = authUser?.id;

      if (!senderId || (!text && !voiceUrl && !mediaUrl)) {
        res.status(400).json({ success: false, error: 'senderId and message body required' });
        return;
      }

      const message = storage.sendMessage(id, senderId, text, voiceUrl, voiceDuration, mediaUrl, mediaType);
      res.status(201).json({ success: true, message });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/conversations/:id/messages/:messageId/pin', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const conversation = storage.getConversations(authUser.id).find((item) => item.id === req.params.id);
      if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found.' });
      storage.togglePinMessage(req.params.id, req.params.messageId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not update pinned message.' });
    }
  });

  app.post('/api/conversations/:id/messages/:messageId/react', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const emoji = String(req.body?.emoji || '').trim();
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      if (!emoji) return res.status(400).json({ success: false, error: 'A reaction is required.' });
      const conversation = storage.getConversations(authUser.id).find((item) => item.id === req.params.id);
      if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found.' });
      storage.reactToMessage(req.params.id, req.params.messageId, emoji);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not react to message.' });
    }
  });

  app.put('/api/conversations/:id/disappearing', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const conversation = storage.getConversations(authUser.id).find((item) => item.id === req.params.id);
      if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found.' });
      const seconds = Number(req.body?.seconds);
      const updated = storage.setDisappearingMessages(req.params.id, authUser.id, seconds);
      res.json({ success: true, conversation: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not update disappearing-message timer.' });
    }
  });

  app.post('/api/conversations/:id/read', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id;
      if (!userId) {
        res.status(400).json({ success: false, error: 'userId required' });
        return;
      }
      storage.markConversationRead(id, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Standalone Channels ---
  app.get('/api/channels', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      res.json({ success: true, channels: storage.getChannels(authUser.id) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/channels', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const channel = storage.createChannel(authUser.id, req.body || {});
      res.status(201).json({ success: true, channel });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not create channel.' });
    }
  });

  app.post('/api/channels/:id/subscribe', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const channel = storage.toggleChannelSubscription(req.params.id, authUser.id);
      res.json({ success: true, channel });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not update subscription.' });
    }
  });

  app.post('/api/channels/:id/posts', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const { content, mediaUrl, mediaType } = req.body || {};
      const channel = storage.createChannelPost(req.params.id, authUser.id, String(content || ''), mediaUrl, mediaType);
      res.status(201).json({ success: true, channel });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not publish channel post.' });
    }
  });

  app.delete('/api/channels/:id', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      storage.deleteChannel(req.params.id, authUser.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Could not delete channel.' });
    }
  });

  // --- Users & Profiles ---
  app.get('/api/users', (_req: Request, res: Response) => {
    try {
      const users = storage.getUsers();
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/users/:id', (req: Request, res: Response) => {
    try {
      const user = storage.getUserById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      if (!authUser || authUser.id !== id) {
        res.status(403).json({ success: false, error: 'You can only modify your own profile' });
        return;
      }
      // Identity, trust, and relationship counters are server-managed fields.
      const { id: _id, verified: _verified, followers: _followers, following: _following,
        followersCount: _followersCount, followingCount: _followingCount,
        postsCount: _postsCount, joinedDate: _joinedDate, ...safeUpdates } = req.body || {};
      const updated = storage.updateProfile(id, safeUpdates);
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/users/:id/follow', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const currentUserId = authUser?.id;

      if (!currentUserId) {
        res.status(400).json({ success: false, error: 'currentUserId is required' });
        return;
      }

      const result = storage.toggleFollow(currentUserId, id);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/users/:id/block', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const currentUserId = authUser?.id;

      if (!currentUserId) {
        res.status(400).json({ success: false, error: 'currentUserId is required' });
        return;
      }

      const isBlocked = storage.toggleBlockUser(currentUserId, id);
      res.json({ success: true, isBlocked });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/users/:id/mute', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const currentUserId = authUser?.id;

      if (!currentUserId) {
        res.status(400).json({ success: false, error: 'currentUserId is required' });
        return;
      }

      const isMuted = storage.toggleMuteUser(currentUserId, id);
      res.json({ success: true, isMuted });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Notifications ---
  app.get('/api/notifications', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const userId = authUser?.id;
      if (!userId) {
        res.status(400).json({ success: false, error: 'userId is required' });
        return;
      }
      const notifications = storage.getNotifications(userId);
      res.json({ success: true, notifications });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
    try {
      const success = storage.markNotificationRead(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const userId = authUser?.id;
      if (!userId) {
        res.status(400).json({ success: false, error: 'userId is required' });
        return;
      }
      const count = storage.markAllNotificationsRead(userId);
      res.json({ success: true, count });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- User Settings ---
  app.get('/api/settings', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const userId = authUser?.id;
      if (!userId) {
        res.status(400).json({ success: false, error: 'userId is required' });
        return;
      }
      const settings = storage.getSettings(userId);
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { updates } = req.body;
      const userId = authUser?.id;

      if (!userId || !updates) {
        res.status(400).json({ success: false, error: 'userId and updates required' });
        return;
      }

      const settings = storage.updateSettings(userId, updates);
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Safety & Moderation ---
  app.post('/api/reports', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { targetType, targetId, reason, reporterHandle: bodyReporter } = req.body;
      const reporterHandle = authUser?.handle || bodyReporter || 'anonymous';

      if (!targetType || !targetId || !reason) {
        res.status(400).json({ success: false, error: 'targetType, targetId, and reason required' });
        return;
      }
      const report = storage.submitReport(targetType, targetId, reason, reporterHandle);
      res.status(201).json({ success: true, report });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/moderation/reports', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const adminIds = (process.env.GISTUPP_ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
      if (!user || !adminIds.includes(user.id)) {
        res.status(403).json({ success: false, error: 'Administrator access required' });
        return;
      }
      const reports = storage.getReports();
      res.json({ success: true, reports });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/moderation/action', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const adminIds = (process.env.GISTUPP_ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
      if (!user || !adminIds.includes(user.id)) {
        res.status(403).json({ success: false, error: 'Administrator access required' });
        return;
      }
      const { reportId, action } = req.body;
      if (!reportId || !['resolve', 'dismiss', 'delete_content'].includes(action)) {
        res.status(400).json({ success: false, error: 'Invalid reportId or action' });
        return;
      }
      const success = storage.resolveReport(reportId, action);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Creator products ---
  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const product = storage.createProduct(authUser.id, req.body?.data || {});
      res.status(201).json({ success: true, product });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Product could not be saved.' });
    }
  });

  // --- Marketplace ---
  app.post('/api/marketplace', async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { data } = req.body;
      const sellerId = authUser?.id;

      if (!sellerId || !data) {
        res.status(400).json({ success: false, error: 'sellerId and data required' });
        return;
      }
      const listing = storage.createListing(sellerId, data);
      if (liveDb) {
        const { error } = await liveDb.from('gistupp_shared_content').upsert({
          content_type: 'marketplace_listing', content_id: listing.id, owner_id: sellerId, payload: listing, expires_at: null,
        }, { onConflict: 'content_type,content_id' });
        if (error) throw error;
      }
      res.status(201).json({ success: true, listing });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/marketplace/:id', async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const { id } = req.params;
      const { updates } = req.body;
      const existing = storage.getBootstrapData(authUser.id).marketplaceListings.find((item: any) => item.id === id);
      if (!existing || existing.seller?.id !== authUser.id) return res.status(404).json({ success: false, error: 'Listing not found or you do not own it.' });
      const listing = storage.updateListing(id, updates || {});
      if (liveDb) {
        const { error } = await liveDb.from('gistupp_shared_content').upsert({
          content_type: 'marketplace_listing', content_id: listing.id, owner_id: authUser.id, payload: listing, expires_at: null,
        }, { onConflict: 'content_type,content_id' });
        if (error) throw error;
      }
      res.json({ success: true, listing });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/marketplace/:id', async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const existing = storage.getBootstrapData(authUser.id).marketplaceListings.find((item: any) => item.id === req.params.id);
      if (!existing || existing.seller?.id !== authUser.id) return res.status(404).json({ success: false, error: 'Listing not found or you do not own it.' });
      const success = storage.deleteListing(req.params.id);
      if (liveDb) {
        const { error } = await liveDb.from('gistupp_shared_content')
          .delete().eq('content_type', 'marketplace_listing').eq('content_id', req.params.id).eq('owner_id', authUser.id);
        if (error) throw error;
      }
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Marketplace Stores ---
  app.get('/api/marketplace/stores', (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || '').toLowerCase().trim();
      const category = String(req.query.category || '').trim();
      let stores = storage.getStores();
      if (q) stores = stores.filter((store) => `${store.name} ${store.description} ${store.category} ${store.location} ${store.owner?.handle || ''}`.toLowerCase().includes(q));
      if (category && category !== 'All') stores = stores.filter((store) => store.category === category);
      res.json({ success: true, stores });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message || 'Could not load stores.' }); }
  });

  app.post('/api/marketplace/stores', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user) { res.status(401).json({ success: false, error: 'Sign in to create a store.' }); return; }
      const store = storage.createStore(user.id, req.body || {});
      res.status(201).json({ success: true, store });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message || 'Could not create store.' }); }
  });

  app.put('/api/marketplace/stores/:id', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user) { res.status(401).json({ success: false, error: 'Sign in to edit your store.' }); return; }
      const store = storage.updateStore(req.params.id, user.id, req.body?.updates || {});
      res.json({ success: true, store });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message || 'Could not update store.' }); }
  });

  app.post('/api/marketplace/stores/:id/follow', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user) { res.status(401).json({ success: false, error: 'Sign in to follow stores.' }); return; }
      const following = storage.toggleStoreFollow(req.params.id, user.id);
      res.json({ success: true, following });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message || 'Could not follow store.' }); }
  });

  // --- Communities ---
  app.post('/api/communities', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      const { data } = req.body || {};
      if (!data || !data.name || !data.description) {
        res.status(400).json({ success: false, error: 'name and description required' });
        return;
      }
      data.createdBy = authUser.id;
      data.ownerId = authUser.id;
      const community = storage.createCommunity(data);
      res.status(201).json({ success: true, community });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/communities/:id', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const community = storage.updateCommunity(req.params.id, authUser.id, req.body?.updates || {});
      res.json({ success: true, community });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Community could not be updated.' });
    }
  });

  app.delete('/api/communities/:id', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const success = storage.deleteCommunity(req.params.id, authUser.id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Community could not be deleted.' });
    }
  });

  app.post('/api/communities/:id/join', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const isJoined = storage.joinCommunity(req.params.id, authUser.id);
      res.json({ success: true, isJoined });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/communities/:id/leave', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      if (!authUser) return res.status(401).json({ success: false, error: 'Authentication required' });
      const isJoined = storage.leaveCommunity(req.params.id, authUser.id);
      res.json({ success: true, isJoined: !isJoined });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return app;
}
