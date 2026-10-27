import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';

export function createExpressApp() {
  const app = express();

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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-session-token');
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

  // --- Helper: Extract Authenticated User ---
  const getAuthUser = (req: Request) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-session-token']) {
      token = String(req.headers['x-session-token']).trim();
    }

    if (token) {
      const user = storage.getUserBySession(token);
      if (user) return user;
    }

    const userIdHeader = req.headers['x-user-id'] as string;
    if (userIdHeader) {
      return storage.getUserById(userIdHeader);
    }

    return undefined;
  };

  // --- Health Check ---
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'RoseOne Backend',
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
  app.get('/api/bootstrap', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const userId = authUser?.id || (req.query.userId as string) || '';
      const data = storage.getBootstrapData(userId);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error in /api/bootstrap:', err);
      res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  // --- Secure Media Upload ---
  app.post('/api/upload', (req: Request, res: Response) => {
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
      const uniqueName = `rose_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Write file if disk is accessible; otherwise graceful dataUrl fallback for Netlify
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
      const { authorId: bodyAuthorId, content, media, pollData, tags, communityId } = req.body;
      const authorId = authUser?.id || bodyAuthorId;

      if (!authorId || !content || typeof content !== 'string') {
        res.status(400).json({ success: false, error: 'authorId and content are required' });
        return;
      }

      const post = storage.createPost(authorId, content.trim(), media, pollData, tags, communityId);
      res.status(201).json({ success: true, post });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/posts/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id || (req.headers['x-user-id'] as string);

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
      const userId = authUser?.id || req.body.userId;

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
      const { reactionType, userId: bodyUserId } = req.body;
      const userId = authUser?.id || bodyUserId;

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
      const userId = authUser?.id || req.body.userId;

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
      const { optionId, userId: bodyUserId } = req.body;
      const userId = authUser?.id || bodyUserId;

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
      const { authorId: bodyAuthorId, content, voiceUrl, voiceDuration, parentCommentId } = req.body;
      const authorId = authUser?.id || bodyAuthorId;

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
      const userId = authUser?.id || req.body.userId;

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
      const userId = authUser?.id || (req.headers['x-user-id'] as string);

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

  app.post('/api/stories', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { userId: bodyUserId, mediaUrl, mediaType, caption, duration } = req.body;
      const userId = authUser?.id || bodyUserId;

      if (!userId || !mediaUrl) {
        res.status(400).json({ success: false, error: 'userId and mediaUrl are required' });
        return;
      }

      const story = storage.createStory(userId, mediaUrl, mediaType || 'image', caption, duration);
      res.status(201).json({ success: true, story });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/stories/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id || (req.headers['x-user-id'] as string);

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
      const userId = authUser?.id || req.body.userId;
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
      const { reaction, userId: bodyUserId } = req.body;
      const userId = authUser?.id || bodyUserId;

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
      const userId = authUser?.id || (req.query.userId as string);
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
      const { senderId: bodySenderId, text, voiceUrl, voiceDuration, mediaUrl } = req.body;
      const senderId = authUser?.id || bodySenderId;

      if (!senderId || (!text && !voiceUrl && !mediaUrl)) {
        res.status(400).json({ success: false, error: 'senderId and message body required' });
        return;
      }

      const message = storage.sendMessage(id, senderId, text, voiceUrl, voiceDuration, mediaUrl);
      res.status(201).json({ success: true, message });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/conversations/:id/read', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const userId = authUser?.id || req.body.userId;
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
      if (authUser && authUser.id !== id && !authUser.verified) {
        res.status(403).json({ success: false, error: 'Cannot modify another user profile' });
        return;
      }
      const updated = storage.updateProfile(id, req.body);
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/users/:id/follow', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req);
      const currentUserId = authUser?.id || req.body.currentUserId;

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
      const currentUserId = authUser?.id || req.body.currentUserId;

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
      const currentUserId = authUser?.id || req.body.currentUserId;

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
      const userId = authUser?.id || (req.query.userId as string);
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
      const userId = authUser?.id || req.body.userId;
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
      const userId = authUser?.id || (req.query.userId as string);
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
      const { userId: bodyUserId, updates } = req.body;
      const userId = authUser?.id || bodyUserId;

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

  app.get('/api/moderation/reports', (_req: Request, res: Response) => {
    try {
      const reports = storage.getReports();
      res.json({ success: true, reports });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/moderation/action', (req: Request, res: Response) => {
    try {
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

  // --- Marketplace ---
  app.post('/api/marketplace', (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(req);
      const { sellerId: bodySellerId, data } = req.body;
      const sellerId = authUser?.id || bodySellerId;

      if (!sellerId || !data) {
        res.status(400).json({ success: false, error: 'sellerId and data required' });
        return;
      }
      const listing = storage.createListing(sellerId, data);
      res.status(201).json({ success: true, listing });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/marketplace/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { updates } = req.body;
      const listing = storage.updateListing(id, updates);
      res.json({ success: true, listing });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/marketplace/:id', (req: Request, res: Response) => {
    try {
      const success = storage.deleteListing(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- Communities ---
  app.post('/api/communities', (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      if (!data || !data.name || !data.description) {
        res.status(400).json({ success: false, error: 'name and description required' });
        return;
      }
      const community = storage.createCommunity(data);
      res.status(201).json({ success: true, community });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/communities/:id/join', (req: Request, res: Response) => {
    try {
      const isJoined = storage.joinCommunity(req.params.id);
      res.json({ success: true, isJoined });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return app;
}
