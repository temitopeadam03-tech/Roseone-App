import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Radio, Video, Users, MessageCircle, Gift, ShieldCheck, Signal, LockKeyhole,
  Sparkles, Settings2, Heart, Crown, Star, Send, Palette, Volume2, Mic,
  Camera, MonitorUp, Clock3, Eye, Coins, X, Check, Info, ChevronDown,
  WandSparkles, MessageSquareText, UserPlus, Flag, Pin, Wifi, Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Room, RoomEvent, Track, createLocalTracks } from 'livekit-client';

type ChatTheme = 'glass' | 'midnight' | 'rose' | 'ocean' | 'classic';
type GiftItem = { id: string; name: string; emoji: string; coins: number; tier: 'Popular' | 'Premium' | 'Legendary'; note: string; art: string; image: string };

const GIFTS: GiftItem[] = [
  { id: 'gist_coin', name: 'Gist Coin', emoji: '🪙', coins: 10, tier: 'Popular', note: 'A little appreciation', art: 'from-amber-300 via-yellow-500 to-orange-600', image: '/gifts/gist-coin.svg' },
  { id: 'blue_diamond', name: 'Blue Diamond', emoji: '💎', coins: 80, tier: 'Popular', note: 'A sparkling thank-you', art: 'from-cyan-200 via-sky-500 to-blue-800', image: '/gifts/blue-diamond.svg' },
  { id: 'silver_crest', name: 'Silver Crest', emoji: '🥈', coins: 250, tier: 'Popular', note: 'A mark of true support', art: 'from-slate-100 via-slate-400 to-slate-700', image: '/gifts/silver-crest.svg' },
  { id: 'gold_reserve', name: 'Gold Reserve', emoji: '🪙', coins: 750, tier: 'Premium', note: 'A golden moment', art: 'from-yellow-200 via-amber-400 to-yellow-700', image: '/gifts/gold-reserve.svg' },
  { id: 'orbit_rocket', name: 'Orbit Rocket', emoji: '🚀', coins: 1500, tier: 'Premium', note: 'Send the stream higher', art: 'from-fuchsia-300 via-violet-500 to-indigo-900', image: '/gifts/orbit-rocket.svg' },
  { id: 'velocity_car', name: 'Velocity Car', emoji: '🏎️', coins: 4000, tier: 'Premium', note: 'Arrive in style', art: 'from-rose-300 via-red-500 to-red-900', image: '/gifts/velocity-car.svg' },
  { id: 'swift_bicycle', name: 'Swift Bicycle', emoji: '🚲', coins: 2500, tier: 'Legendary', note: 'Keep the energy moving', art: 'from-emerald-200 via-teal-500 to-cyan-900', image: '/gifts/swift-bicycle.svg' },
  { id: 'ocean_yacht', name: 'Ocean Yacht', emoji: '🛥️', coins: 8000, tier: 'Legendary', note: 'A luxury celebration', art: 'from-sky-200 via-blue-500 to-slate-900', image: '/gifts/ocean-yacht.svg' },
  { id: 'aurora_crown', name: 'Aurora Crown', emoji: '👑', coins: 15000, tier: 'Legendary', note: 'A once-in-a-stream moment', art: 'from-pink-200 via-purple-500 to-amber-500', image: '/gifts/aurora-crown.svg' },
];

const CHAT_THEMES: { id: ChatTheme; label: string; sample: string; swatch: string }[] = [
  { id: 'glass', label: 'Soft glass', sample: 'bg-white/15 border-white/20', swatch: 'bg-slate-400' },
  { id: 'midnight', label: 'Midnight', sample: 'bg-slate-950/80 border-slate-700', swatch: 'bg-slate-950' },
  { id: 'rose', label: 'Rose', sample: 'bg-rose-950/75 border-rose-400/30', swatch: 'bg-pink-500' },
  { id: 'ocean', label: 'Ocean', sample: 'bg-sky-950/75 border-sky-400/30', swatch: 'bg-sky-500' },
  { id: 'classic', label: 'Classic', sample: 'bg-black/65 border-white/10', swatch: 'bg-black' },
];

export const LiveView: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [showStudio, setShowStudio] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Just Chatting');
  const [visibility, setVisibility] = useState<'public' | 'followers'>('public');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [deviceCount, setDeviceCount] = useState(0);
  const [chatTheme, setChatTheme] = useState<ChatTheme>('glass');
  const [chatOpacity, setChatOpacity] = useState(80);
  const [chatFontSize, setChatFontSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftFilter, setGiftFilter] = useState<'All' | GiftItem['tier']>('All');
  const [selectedGift, setSelectedGift] = useState<GiftItem>(GIFTS[0]);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [showChatDesigner, setShowChatDesigner] = useState(false);
  const [goal, setGoal] = useState('Help us reach 100 supporters');
  const [pinnedMessage, setPinnedMessage] = useState('Welcome to my Gistupp Live! Be kind and enjoy the session 💗');
  const [allowGuests, setAllowGuests] = useState(true);
  const [slowMode, setSlowMode] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [liveRoom, setLiveRoom] = useState<Room | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<'idle'|'connecting'|'live'|'error'>('idle');
  const [viewerCount, setViewerCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [watchSession, setWatchSession] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const watchVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(track => track.stop()); liveRoom?.disconnect(); }, [liveRoom]);
  useEffect(() => { if (cameraReady && videoRef.current && streamRef.current) { videoRef.current.srcObject = streamRef.current; void videoRef.current.play().catch(() => {}); } }, [cameraReady, showStudio]);
  useEffect(() => { if (!watchSession || !liveRoom || !watchVideoRef.current) return; liveRoom.remoteParticipants.forEach(participant => participant.trackPublications.forEach(publication => { if (publication.track?.kind === Track.Kind.Video) publication.track.attach(watchVideoRef.current!); })); }, [watchSession, liveRoom]);

  useEffect(() => { const token = localStorage.getItem('rose_auth_token'); if (!token) return; fetch('/api/live/wallet', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).then(d => { if (d?.success) setWalletBalance(d.balance); }).catch(() => {}); }, []);
  useEffect(() => { const load = () => fetch('/api/live/sessions').then(r => r.ok ? r.json() : null).then(d => { if (d?.success) setLiveSessions(d.sessions || []); }).catch(() => {}); load(); const timer = window.setInterval(load, 12000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const token = localStorage.getItem('rose_auth_token'); if (!token) return; fetch('/api/live/chat-preferences', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).then(d => { const p = d?.preferences; if (p) { setChatTheme(p.theme); setChatOpacity(p.opacity); setChatFontSize(p.font_size); } }).catch(() => {}); }, []);
  const saveChatPreferences = async () => { const token = localStorage.getItem('rose_auth_token'); if (!token) { showToast('Sign in to save your comment style.', 'info'); return; } try { const response = await fetch('/api/live/chat-preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ theme: chatTheme, opacity: chatOpacity, fontSize: chatFontSize }) }); if (!response.ok) throw new Error('Could not save your live comment settings.'); showToast('Live comment appearance saved to your account.', 'success'); setShowChatDesigner(false); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not save settings.', 'error'); } };

  const filteredGifts = useMemo(() => giftFilter === 'All' ? GIFTS : GIFTS.filter(g => g.tier === giftFilter), [giftFilter]);
  const giftTotal = selectedGift.coins * giftQuantity;
  const chatThemeClass = CHAT_THEMES.find(t => t.id === chatTheme)?.sample || CHAT_THEMES[0].sample;

  const openStudio = async () => {
    setShowStudio(true); setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access requires HTTPS and a supported browser.');
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDeviceCount(devices.filter(device => device.kind === 'videoinput').length);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch (error) { setCameraReady(false); setCameraError(error instanceof Error ? error.message : 'Camera and microphone permission was not granted.'); }
  };
  const closeStudio = (force = false) => { if (liveStatus === 'live' && !force) { showToast('End your broadcast before closing Live Studio.', 'info'); return; } streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; setCameraReady(false); setShowStudio(false); };
  const requestBroadcast = async () => {
    const authToken = localStorage.getItem('rose_auth_token');
    if (!authToken) { showToast('Please sign in before starting a live broadcast.', 'error'); return; }
    setLiveStatus('connecting');
    try {
      streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
      const response = await fetch('/api/live/start', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ title: title.trim(), category, visibility }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Live session could not be created.');
      const room = new Room({ adaptiveStream: true, dynacast: true });
      room.on(RoomEvent.ParticipantConnected, () => setViewerCount(room.numParticipants));
      room.on(RoomEvent.ParticipantDisconnected, () => setViewerCount(room.numParticipants));
      room.on(RoomEvent.TrackSubscribed, (track) => { if (track.kind === Track.Kind.Video && remoteVideoRef.current) track.attach(remoteVideoRef.current); });
      room.on(RoomEvent.DataReceived, (payload) => { try { const item = JSON.parse(new TextDecoder().decode(payload)); if (item?.type === 'gistupp-live-chat') setChatMessages(old => [...old, item.message].slice(-100)); if (item?.type === 'gistupp-live-gift') showToast(`${item.gift} sent to the creator!`, 'success'); } catch {} });
      room.on(RoomEvent.Disconnected, () => setLiveStatus('idle'));
      await room.connect(data.serverUrl, data.token);
      const tracks = await createLocalTracks({ audio: true, video: { facingMode: 'user' } });
      for (const track of tracks) { await room.localParticipant.publishTrack(track); if (track.kind === Track.Kind.Video && videoRef.current) track.attach(videoRef.current); }
      const publishResponse = await fetch(`/api/live/${data.session.id}/publish`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } });
      if (!publishResponse.ok) throw new Error('Your media connected, but the room could not be published.');
      setLiveRoom(room); setActiveSessionId(data.session.id); setLiveStatus('live'); setViewerCount(0);
      showToast('You are live on Gistupp. Your room is connected.', 'success');
    } catch (error) { setLiveStatus('error'); showToast(error instanceof Error ? error.message : 'Could not connect to LiveKit.', 'error'); }
  };
  const joinLive = async (session: any) => {
    const token = localStorage.getItem('rose_auth_token');
    if (!token) { showToast('Sign in to watch and chat in Gistupp Live.', 'info'); return; }
    try {
      const response = await fetch(`/api/live/${session.id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Could not join this live room.');
      const room = new Room({ adaptiveStream: true, dynacast: true });
      room.on(RoomEvent.TrackSubscribed, (track) => { if (track.kind === Track.Kind.Video && watchVideoRef.current) track.attach(watchVideoRef.current); });
      room.on(RoomEvent.DataReceived, (payload) => { try { const item = JSON.parse(new TextDecoder().decode(payload)); if (item?.type === 'gistupp-live-chat') setChatMessages(old => [...old, item.message].slice(-100)); if (item?.type === 'gistupp-live-gift') showToast(`${item.gift} sent to the creator!`, 'success'); } catch {} });
      await room.connect(data.serverUrl, data.token);
      setLiveRoom(room); setActiveSessionId(session.id); setWatchSession(session);
      const chatResponse = await fetch(`/api/live/${session.id}/chat`, { headers: { Authorization: `Bearer ${token}` } }); const chatData = await chatResponse.json(); setChatMessages(chatData.messages || []);
      showToast(`Joined ${session.title}`, 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not join live.', 'error'); }
  };
  const leaveLive = async () => { const id = watchSession?.id; const token = localStorage.getItem('rose_auth_token'); if (id) { try { await fetch(`/api/live/${id}/leave`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {} } liveRoom?.disconnect(); setLiveRoom(null); setActiveSessionId(null); setWatchSession(null); setChatMessages([]); };
  const sendLiveComment = async () => {
    if (!watchSession || !chatDraft.trim()) return;
    const token = localStorage.getItem('rose_auth_token'); const body = chatDraft.trim().slice(0, 500); setChatDraft('');
    try { const response = await fetch(`/api/live/${watchSession.id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ body }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Comment could not be sent.'); setChatMessages(old => [...old, data.message].slice(-100)); if (liveRoom) await liveRoom.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: 'gistupp-live-chat', message: data.message })), { reliable: true }); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not send comment.', 'error'); }
  };
  const endBroadcast = async () => {
    if (!activeSessionId) return;
    const token = localStorage.getItem('rose_auth_token');
    try { await fetch(`/api/live/${activeSessionId}/end`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    liveRoom?.disconnect(); setLiveRoom(null); setActiveSessionId(null); setLiveStatus('idle'); setViewerCount(0); closeStudio(true); showToast('Your live session has ended.', 'success');
  };
  const requestGift = async () => {
    if (!watchSession || !activeSessionId) { showToast('Gifts can be sent inside an active Gistupp live room.', 'info'); return; }
    const token = localStorage.getItem('rose_auth_token');
    try { const response = await fetch(`/api/live/${activeSessionId}/gifts`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ giftCode: selectedGift.id, quantity: giftQuantity }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Gift could not be sent.'); setWalletBalance(data.receipt.remainingBalance); if (liveRoom) await liveRoom.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: 'gistupp-live-gift', gift: selectedGift.name, quantity: giftQuantity, coins: data.receipt.coins })), { reliable: true }); showToast(`${selectedGift.name} sent successfully!`, 'success'); setShowGiftPanel(false); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Gift delivery failed.', 'error'); }
  };

  return <div className="space-y-5 pb-8">
    <section className="relative overflow-hidden rounded-3xl bg-[#171018] text-white">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-pink-600/20 blur-3xl" />
      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-200"><span className="h-2 w-2 rounded-full bg-rose-400"/> Gistupp Live Studio</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Your stage. Your people. Live.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Host conversations, performances, classes and community moments. Prepare your camera, audience settings, guest stage and chat experience before you go live.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-white/70"><span className="rounded-full bg-white/10 px-3 py-1.5"><ShieldCheck className="mr-1 inline" size={13}/> Host controls</span><span className="rounded-full bg-white/10 px-3 py-1.5"><Gift className="mr-1 inline" size={13}/> Virtual gifts</span><span className="rounded-full bg-white/10 px-3 py-1.5"><Users className="mr-1 inline" size={13}/> Guest stage</span></div>
          <button onClick={openStudio} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E91E8C] px-5 py-3 text-sm font-extrabold shadow-lg shadow-pink-950/30 hover:bg-[#BE185D]"><Radio size={17}/> Set up a live</button>
        </div>
        <div className="grid grid-cols-2 gap-3">{[
          { icon: Video, title: 'HD-ready studio', copy: 'Camera and mic checks' }, { icon: Users, title: 'Guest stage', copy: 'Invite co-hosts' },
          { icon: MessageCircle, title: 'Styled live chat', copy: 'Pinned notes and controls' }, { icon: Gift, title: 'Smart gifts', copy: 'Gift tiers and coin values' },
        ].map(item => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><item.icon className="h-5 w-5 text-pink-300"/><p className="mt-3 text-sm font-bold">{item.title}</p><p className="mt-1 text-[11px] leading-4 text-white/50">{item.copy}</p></div>)}</div>
      </div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#17131A]">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Live discovery</h2><p className="mt-1 text-xs text-slate-500">Public rooms refresh automatically while you explore.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{liveSessions.length} active room(s)</span></div>
        <div className="grid gap-3 sm:grid-cols-2">{liveSessions.length ? liveSessions.map(session => <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="min-w-0"><span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"/> LIVE</span><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{session.title}</p><p className="text-[10px] text-slate-500">{session.category} · {session.viewer_count || 0} watching</p></div><button onClick={() => joinLive(session)} className="shrink-0 rounded-lg bg-pink-600 px-3 py-2 text-[10px] font-bold text-white">Join live</button></div>) : <div className="col-span-full rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700"><Radio className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600"/><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No one is live right now</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">When creators start broadcasting, their public rooms will appear here automatically.</p></div>}</div>
        <div className="grid gap-3 sm:grid-cols-3">{[{ icon: Eye, label: 'Viewer insights', desc: 'Live viewers, peak count and watch time' }, { icon: Coins, label: 'Gift analytics', desc: 'Gift activity and creator earnings' }, { icon: Wifi, label: 'Stream health', desc: 'Connection quality and bitrate' }].map(x => <div key={x.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60"><x.icon size={17} className="text-pink-500"/><p className="mt-2 text-xs font-bold text-slate-800 dark:text-white">{x.label}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{x.desc}</p></div>)}</div>
      </div>
      <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#17131A]">
        <h3 className="font-extrabold text-slate-900 dark:text-white">Creator toolkit</h3>
        {[{icon:ShieldCheck,label:'Host and chat moderation',detail:'Block, mute and remove viewers'},{icon:Users,label:'Multi-guest stage',detail:'Invite and manage co-hosts'},{icon:Gift,label:'Gift and earnings tools',detail:'Transparent gift values'},{icon:Signal,label:'Stream health and quality',detail:'Connection and device status'},{icon:LockKeyhole,label:'Audience and privacy',detail:'Public or followers-only'},{icon:Sparkles,label:'Replay and highlights',detail:'Save moments after the stream'}].map(item=><div key={item.label} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60"><item.icon size={16} className="mt-0.5 shrink-0 text-[#E91E8C]"/><div><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.label}</p><p className="mt-0.5 text-[10px] text-slate-500">{item.detail}</p></div></div>)}
        <button onClick={() => setShowTips(!showTips)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"><span className="flex items-center gap-2"><Info size={14}/> Live creator tips</span><ChevronDown size={14} className={showTips ? 'rotate-180' : ''}/></button>
        {showTips && <div className="rounded-xl bg-pink-50 p-3 text-[11px] leading-5 text-pink-900 dark:bg-pink-950/30 dark:text-pink-100">Use a clear title, test your microphone, pin your community rules and assign a trusted moderator before inviting a large audience.</div>}
      </aside>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#17131A]">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-extrabold text-slate-900 dark:text-white">Live chat & gift design preview</h2><p className="mt-1 text-xs text-slate-500">Preview how comments and gifts can appear during a broadcast.</p></div><div className="flex gap-2"><button onClick={() => setShowChatDesigner(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><Palette size={14}/> Edit chat look</button><button onClick={() => setShowGiftPanel(true)} className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-3 py-2 text-xs font-bold text-white"><Gift size={14}/> Gift gallery</button></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="relative min-h-[270px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#291526] via-[#211b35] to-[#101827] p-4 text-white">
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-[10px] font-bold"><span className="h-2 w-2 rounded-full bg-rose-500"/> PREVIEW</div>
          <div className="mt-12 max-w-sm space-y-2">
            <div className={`w-fit max-w-full rounded-2xl border px-3 py-2 text-xs ${chatThemeClass}`} style={{ opacity: chatOpacity / 100 }}><b className="text-pink-200">Gistupp Helper</b><p className="mt-1">Welcome! Keep the chat respectful 💗</p></div>
            <div className={`w-fit max-w-full rounded-2xl border px-3 py-2 ${chatThemeClass}`} style={{ opacity: chatOpacity / 100 }}><b className="text-amber-200 text-xs">@creator_fan</b><p className={chatFontSize === 'small' ? 'text-[10px]' : chatFontSize === 'large' ? 'text-sm' : 'text-xs'}>Loving this live session!</p></div>
            <div className="flex w-fit items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-400/15 px-3 py-2 text-xs"><img src={selectedGift.image} alt="" className="h-9 w-9 object-contain"/><span><b>@supporter</b> sent {selectedGift.name}</span></div>
            <div className={`w-fit max-w-full rounded-2xl border px-3 py-2 text-xs ${chatThemeClass}`} style={{ opacity: chatOpacity / 100 }}><b className="text-emerald-200">@new_viewer</b><p className="mt-1">Just joined. Hello everyone 👋</p></div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2"><div className="flex-1 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/50">Write a comment…</div><span className="rounded-full bg-pink-600 p-2"><Heart size={15}/></span><span className="rounded-full bg-white/15 p-2"><Gift size={15}/></span></div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60"><p className="text-xs font-bold text-slate-800 dark:text-white">Gift spotlight</p><div className="mt-3 flex items-center gap-3"><img src={selectedGift.image} alt={selectedGift.name} className="h-14 w-14 object-contain"/><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedGift.name}</p><p className="text-xs text-slate-500">{selectedGift.coins.toLocaleString()} coins</p></div></div><button onClick={() => setShowGiftPanel(true)} className="mt-3 w-full rounded-lg bg-pink-600 px-3 py-2 text-xs font-bold text-white">Explore gifts</button></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60"><p className="text-xs font-bold text-slate-800 dark:text-white">Pinned host note</p><p className="mt-2 text-xs leading-5 text-slate-500">{pinnedMessage}</p><p className="mt-2 text-[10px] text-slate-400">Host-editable • Preview only</p></div>
        </div>
      </div>
    </section>

    {showStudio && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-6"><div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#17131A]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-[#17131A]/95"><div><h2 className="font-extrabold text-slate-900 dark:text-white">Live Studio setup</h2><p className="text-xs text-slate-500">Configure your broadcast and audience experience.</p></div><button onClick={closeStudio} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close studio"><X size={18}/></button></div>
      <div className="grid gap-5 p-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-3"><div className="overflow-hidden rounded-2xl bg-black"><div className="relative flex aspect-video items-center justify-center">{cameraReady || liveStatus === 'live' ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover"/> : <div className="px-6 text-center text-white/60"><Video className="mx-auto h-10 w-10"/><p className="mt-3 text-sm font-semibold">Camera preview unavailable</p><p className="mt-1 text-xs">Allow camera and microphone access to preview your setup.</p></div>}</div><div ref={remoteVideoRef} className="pointer-events-none absolute inset-0 grid grid-cols-2 gap-1 overflow-hidden"/><div className="flex flex-wrap items-center justify-between gap-2 bg-[#211923] px-4 py-3 text-xs text-white/70"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${liveStatus === 'live' ? 'bg-rose-500 animate-pulse' : cameraReady ? 'bg-emerald-400' : 'bg-amber-400'}`}/>{liveStatus === 'live' ? 'LIVE • Connected to room' : cameraReady ? 'Camera and microphone ready' : 'Waiting for device access'}</span><span>{viewerCount} viewer(s) connected</span></div></div>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs font-bold text-slate-800 dark:text-white"><Camera size={14} className="mr-1 inline"/> Camera</p><p className="mt-1 text-[10px] text-slate-500">{cameraReady ? 'Permission granted' : 'Not connected'}</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs font-bold text-slate-800 dark:text-white"><Mic size={14} className="mr-1 inline"/> Microphone</p><p className="mt-1 text-[10px] text-slate-500">{cameraReady ? 'Permission granted' : 'Not connected'}</p></div></div>
          {cameraError && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{cameraError}</p>}
          <button onClick={openStudio} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Check camera and microphone again</button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Live title<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={90} placeholder={`${currentUser.name}'s live session`} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"/></label>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Category<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">{['Just Chatting','Music','Gaming','Education','Business','Lifestyle','News & Events','Sports','Faith & Inspiration','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Audience<select value={visibility} onChange={e=>setVisibility(e.target.value as 'public'|'followers')} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="public">Everyone</option><option value="followers">Followers only</option></select></label>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><p className="text-xs font-extrabold text-slate-800 dark:text-white">Room controls</p>{[{label:'Allow guest requests',value:allowGuests,set:setAllowGuests},{label:'Enable live chat',value:chatEnabled,set:setChatEnabled},{label:'Slow mode',value:slowMode,set:setSlowMode}].map(row=><label key={row.label} className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">{row.label}<input type="checkbox" checked={row.value} onChange={e=>row.set(e.target.checked)} className="h-4 w-4 accent-pink-600"/></label>)}</div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Pinned welcome message<textarea value={pinnedMessage} onChange={e=>setPinnedMessage(e.target.value)} maxLength={180} rows={2} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"/></label>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Community goal<input value={goal} onChange={e=>setGoal(e.target.value)} maxLength={80} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"/></label>
          <button onClick={requestBroadcast} disabled={!title.trim() || (!cameraReady && liveStatus !== 'live') || liveStatus === 'connecting' || liveStatus === 'live'} className="w-full rounded-xl bg-[#E91E8C] px-3 py-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><Radio size={14} className="mr-1 inline"/> {liveStatus === 'connecting' ? 'Connecting…' : liveStatus === 'live' ? 'You are live' : 'Go live'}</button>{liveStatus === 'live' && <button onClick={endBroadcast} className="w-full rounded-xl bg-slate-900 px-3 py-3 text-xs font-extrabold text-white">End broadcast</button>}
          <p className="text-[10px] leading-4 text-slate-500">LiveKit connects your camera and microphone to the room. Add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to the server environment before going live.</p>
        </div>
      </div>
    </div></div>}

    {watchSession && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-2 sm:p-5"><div className="grid max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#17131A] md:grid-cols-[1.5fr_.8fr]"><section className="flex min-h-0 flex-col bg-black"><div className="flex items-center justify-between p-3 text-white"><div><span className="text-[10px] font-bold text-rose-400">● LIVE NOW</span><h3 className="text-sm font-extrabold">{watchSession.title}</h3></div><button onClick={leaveLive} className="rounded-lg bg-white/10 p-2"><X size={17}/></button></div><video ref={watchVideoRef} autoPlay playsInline className="max-h-[65vh] min-h-[220px] w-full flex-1 object-contain"/><div className="flex items-center justify-between p-3 text-xs text-white/70"><span>{watchSession.category}</span><button onClick={() => setShowGiftPanel(true)} className="rounded-lg bg-pink-600 px-3 py-2 font-bold text-white"><Gift size={14} className="mr-1 inline"/> Send a gift</button></div></section><section className="flex min-h-[420px] flex-col p-3"><div className="mb-2 flex items-center justify-between"><b className="text-sm text-slate-900 dark:text-white">Live conversation</b><span className="text-[10px] text-slate-500">Respect everyone</span></div><div className="flex-1 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-900">{chatMessages.map((m,i)=><div key={m.id || i} className={`rounded-xl border px-3 py-2 text-xs ${chatThemeClass}`} style={{opacity:chatOpacity/100}}><b className="text-pink-500">{m.sender_id === currentUser.id ? 'You' : 'Viewer'}</b><p className="mt-1 break-words text-slate-800 dark:text-slate-100">{m.body}</p></div>)}</div><div className="mt-2 flex gap-2"><input value={chatDraft} onChange={e=>setChatDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')sendLiveComment();}} maxLength={500} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"/><button onClick={sendLiveComment} className="rounded-xl bg-pink-600 px-3 text-white"><Send size={15}/></button></div></section></div></div>}

    {showChatDesigner && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#17131A]"><div className="flex items-center justify-between"><div><h3 className="font-extrabold text-slate-900 dark:text-white">Live comment appearance</h3><p className="mt-1 text-xs text-slate-500">Choose a distinctive comment look for your live room.</p></div><button onClick={() => setShowChatDesigner(false)} className="rounded-lg p-2 text-slate-500"><X size={17}/></button></div>
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#291526] to-[#101827] p-4 text-white"><div className={`rounded-xl border p-3 ${chatThemeClass}`} style={{ opacity: chatOpacity / 100 }}><b className="text-xs text-pink-200">@viewer_name</b><p className={`mt-1 ${chatFontSize === 'small' ? 'text-[10px]' : chatFontSize === 'large' ? 'text-base' : 'text-xs'}`}>This is how your live comments will look.</p></div></div>
      <p className="mt-4 text-xs font-bold text-slate-700 dark:text-slate-200">Comment background</p><div className="mt-2 grid grid-cols-5 gap-2">{CHAT_THEMES.map(t=><button key={t.id} onClick={() => setChatTheme(t.id)} className={`rounded-xl border p-2 text-center ${chatTheme === t.id ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-slate-200 dark:border-slate-700'}`}><span className={`mx-auto block h-7 w-7 rounded-full ${t.swatch}`}/><span className="mt-1 block text-[9px] text-slate-600 dark:text-slate-300">{t.label}</span>{chatTheme === t.id && <Check size={12} className="mx-auto mt-1 text-pink-500"/>}</button>)}</div>
      <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-slate-200">Background opacity <span className="float-right tabular-nums text-slate-500">{chatOpacity}%</span><input type="range" min="30" max="100" value={chatOpacity} onChange={e=>setChatOpacity(Number(e.target.value))} className="mt-2 w-full accent-pink-600"/></label>
      <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-slate-200">Comment text size<select value={chatFontSize} onChange={e=>setChatFontSize(e.target.value as 'small'|'normal'|'large')} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="small">Compact</option><option value="normal">Default</option><option value="large">Large</option></select></label>
      <button onClick={saveChatPreferences} className="mt-5 w-full rounded-xl bg-pink-600 px-4 py-3 text-xs font-extrabold text-white">Save comment appearance</button><p className="mt-2 text-[10px] text-slate-400">Your choices are saved to your Gistupp account and can be reused across devices after the database migration is applied.</p>
    </div></div>}

    {showGiftPanel && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#17131A]"><div className="flex items-center justify-between"><div><h3 className="font-extrabold text-slate-900 dark:text-white">Gistupp Smart Gifts</h3><p className="mt-1 text-xs text-slate-500">Original Gistupp gifts — coins, precious metals, speed and luxury.</p></div><button onClick={() => setShowGiftPanel(false)} className="rounded-lg p-2 text-slate-500"><X size={17}/></button></div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20"><div className="flex items-center gap-2"><Coins size={17} className="text-amber-500"/><div><p className="text-xs font-extrabold text-slate-800 dark:text-white">Gistupp coin wallet</p><p className="text-[10px] text-slate-500">{walletBalance === null ? 'Wallet unavailable' : `${walletBalance.toLocaleString()} coins available`}</p></div></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-amber-700 dark:bg-slate-900 dark:text-amber-300">Top-ups coming later</span></div>
      <div className="mt-4 flex flex-wrap gap-2">{(['All','Popular','Premium','Legendary'] as const).map(f=><button key={f} onClick={() => setGiftFilter(f)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${giftFilter === f ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{f}</button>)}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{filteredGifts.map(g=><button key={g.id} onClick={() => setSelectedGift(g)} className={`rounded-xl border p-3 text-center ${selectedGift.id === g.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20' : 'border-slate-200 dark:border-slate-700'}`}><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-200 shadow-inner dark:from-slate-800 dark:to-slate-950"><img src={g.image} alt={g.name} className="h-16 w-16 object-contain drop-shadow-xl" loading="lazy"/></span><p className="mt-2 text-xs font-extrabold text-slate-800 dark:text-white">{g.name}</p><p className="mt-1 text-[10px] text-slate-500">{g.coins.toLocaleString()} coins</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-500 dark:bg-slate-800">{g.tier}</span></button>)}</div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><div><p className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white"><img src={selectedGift.image} alt="" className="h-8 w-8 object-contain"/>{selectedGift.name}</p><p className="text-[10px] text-slate-500">{selectedGift.coins.toLocaleString()} coins each</p></div><div className="flex items-center gap-3"><button onClick={() => setGiftQuantity(Math.max(1, giftQuantity - 1))} className="h-8 w-8 rounded-full bg-white text-sm font-bold dark:bg-slate-800">−</button><span className="w-4 text-center text-xs font-bold tabular-nums text-slate-800 dark:text-white">{giftQuantity}</span><button onClick={() => setGiftQuantity(Math.min(99, giftQuantity + 1))} className="h-8 w-8 rounded-full bg-white text-sm font-bold dark:bg-slate-800">+</button></div></div>
      <div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">Estimated total</span><b className="text-sm text-slate-900 dark:text-white">{giftTotal.toLocaleString()} coins</b></div>
      <button onClick={requestGift} disabled={!watchSession} className="mt-4 w-full rounded-xl bg-pink-600 px-4 py-3 text-xs font-extrabold text-white disabled:opacity-40">{watchSession ? 'Send gift' : 'Join a live to send gifts'}</button><p className="mt-2 text-[10px] leading-4 text-slate-400">Prices are Gistupp Coins. Purchases/top-ups are intentionally unavailable until you add your payment provider. Gifts can only be sent from an already funded wallet.</p>
    </div></div>}
  </div>;
};
