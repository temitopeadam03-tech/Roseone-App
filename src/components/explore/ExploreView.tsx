import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Compass, Users, TrendingUp, Heart, MessageCircle, Repeat2, Bookmark, Share2, Upload, X, ChevronUp, ChevronDown, Send, Volume2, VolumeX, UserPlus, UserCheck, Settings2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

const isVideoSource = (src: string) => /^data:video\//i.test(src) || /\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(src) || /video/i.test(src);
type FeedMode = 'discover' | 'circle' | 'following' | 'trending';

export const ExploreView: React.FC = () => {
  const { posts, currentUser, comments, addComment, toggleFollowUser, openUserProfile, setCreatePostModalOpen, toggleLikePost, toggleSavePost, setReshareModalPost, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FeedMode>('discover');
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('roseone_video_auto_next') !== 'false');
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [playbackSettingsOpen, setPlaybackSettingsOpen] = useState(false);
  const commentPanelRef = useRef<HTMLDivElement | null>(null);
  const [muted, setMuted] = useState(true);
  const query = searchQuery.trim().toLowerCase();
  const videoPosts = useMemo(() => posts.filter(p => (p.media || []).some(isVideoSource)), [posts]);
  const filtered = useMemo(() => videoPosts.filter(p => {
    if (activeTab === 'circle' && !currentUser.following?.includes(p.author.id) && p.author.id !== currentUser.id) return false;
    if (activeTab === 'following' && !currentUser.following?.includes(p.author.id)) return false;
    if (query && ![p.content, p.author?.name, p.author?.handle, ...(p.tags || [])].some(v => String(v || '').toLowerCase().includes(query))) return false;
    return true;
  }).sort((a,b) => activeTab === 'trending' ? (b.viewsCount + b.likesCount * 3 + b.commentsCount * 2) - (a.viewsCount + a.likesCount * 3 + a.commentsCount * 2) : b.createdTimestamp-a.createdTimestamp), [videoPosts, activeTab, currentUser, query]);
  const current = filtered[Math.min(activeIndex, Math.max(0, filtered.length - 1))];
  useEffect(() => { if (commentOpen) requestAnimationFrame(() => commentPanelRef.current?.focus()); }, [commentOpen, current?.id]);
  const nextVideo = () => { setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); setCommentOpen(false); };
  const previousVideo = () => { setActiveIndex(i => Math.max(i - 1, 0)); setCommentOpen(false); };
  const switchTab = (tab: FeedMode) => { setActiveTab(tab); setActiveIndex(0); setCommentOpen(false); };
  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = commentText.trim();
    if (!current || !content || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const saved = await addComment(current.id, content);
      if (saved) setCommentText('');
    } finally {
      setCommentSubmitting(false);
    }
  };
  const shareVideo = async () => {
    if (!current) return;
    const url = `${location.origin}/post/${current.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'GistUpp video', url });
      else { await navigator.clipboard.writeText(url); showToast('Video link copied.', 'success'); }
    } catch (error) { if ((error as Error).name !== 'AbortError') showToast('Unable to share this video right now.', 'error'); }
  };

  return <section className="relative -mx-2.5 sm:-mx-4 lg:mx-0 -mt-3 sm:-mt-5 h-[calc(100dvh-128px)] min-h-[420px] overflow-hidden bg-black text-white lg:rounded-2xl" aria-label="Explore videos">
    <div className="absolute inset-0">
      {!current ? <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center bg-[#090909]"><Compass className="mb-3 h-8 w-8 text-white/50"/><p className="text-sm font-semibold">No videos yet</p><p className="mt-1 max-w-xs text-xs text-white/55">Videos shared by GistUpp members will appear here.</p><button onClick={() => setCreatePostModalOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E91E8C] px-4 py-2 text-xs font-semibold"><Upload size={14}/> Upload video</button></div> : <video key={current.id + String((current.media || []).find(isVideoSource))} src={(current.media || []).find(isVideoSource)} controls={false} playsInline autoPlay muted={muted} loop={!autoNext} className="h-full w-full object-contain sm:object-cover" onEnded={() => { if (autoNext) nextVideo(); }} onClick={e => { const v=e.currentTarget; if(v.paused) void v.play(); else v.pause(); }} onError={() => showToast('This video could not be played in this browser.', 'error')}/>}
    </div>

    <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/65 to-transparent px-3 pb-7 pt-3">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto no-scrollbar">
          {([{id:'discover',label:'Discover',icon:Compass},{id:'circle',label:'Circle',icon:Users},{id:'following',label:'Following',icon:Users},{id:'trending',label:'Trending',icon:TrendingUp}] as const).map(t => <button key={t.id} onClick={() => switchTab(t.id)} className={`shrink-0 border-b-2 px-1 pb-1 text-[11px] font-semibold transition-colors ${activeTab===t.id?'border-white text-white':'border-transparent text-white/65'}`}>{t.label}</button>)}
        </div>
        <button onClick={() => setPlaybackSettingsOpen(v => !v)} aria-label="Explore settings" aria-expanded={playbackSettingsOpen} title="Explore settings" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-[11px] font-semibold text-white"><Settings2 size={14}/> Settings</button><button onClick={() => setCreatePostModalOpen(true)} aria-label="Upload video" title="Upload video" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15"><Upload size={16}/></button>
      </div>
    {playbackSettingsOpen && <div className="absolute right-3 top-14 z-30 w-[min(19rem,calc(100%-1.5rem))] rounded-2xl border border-white/15 bg-[#17131A]/95 p-3.5 text-white shadow-2xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-bold">Playback controls</p><p className="mt-0.5 text-[11px] text-white/65">Choose how Explore moves between videos.</p></div><button onClick={() => setPlaybackSettingsOpen(false)} aria-label="Close playback controls" className="grid h-7 w-7 place-items-center rounded-full bg-white/10"><X size={15}/></button></div>
      <button onClick={() => { const next = !autoNext; setAutoNext(next); localStorage.setItem('roseone_video_auto_next', String(next)); }} className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5"><span><span className="block text-xs font-semibold">Auto-play next</span><span className="mt-0.5 block text-[10px] text-white/60">Move to the next video when the current one ends.</span></span><span className={"relative h-5 w-9 rounded-full transition-colors " + (autoNext ? "bg-[#E91E8C]" : "bg-white/25")}><span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform " + (autoNext ? "translate-x-4" : "translate-x-0.5")}/></span></button>
      <div className="mt-1 rounded-xl px-2 py-2"><p className="text-xs font-semibold">Manual navigation</p><p className="mt-0.5 text-[10px] text-white/60">Previous and Next remain available, so you can always move videos yourself.</p></div>
      <div className="mt-1 rounded-xl px-2 py-2"><p className="text-xs font-semibold">Video upload limit</p><p className="mt-0.5 text-[10px] text-white/60">Videos are limited to 30 minutes. GistUpp checks video duration on the server before accepting an upload.</p></div>
    </div>}
      <div className="mt-2 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-sm">
        <Search size={14} className="shrink-0 text-white/70"/><input value={searchQuery} onChange={e => {setSearchQuery(e.target.value);setActiveIndex(0)}} placeholder="Search videos, creators, hashtags" className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-white/60"/>
        {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14}/></button>}
      </div>
    </div>

    {current && <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 pb-4 pt-20">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2"><button onClick={() => openUserProfile(current.author)} className="flex items-center gap-2 text-left"><Avatar src={current.author.avatar} name={current.author.name} size="sm"/><span className="text-xs font-bold">@{current.author.handle}</span></button>{current.author.id !== currentUser.id && <button onClick={() => toggleFollowUser(current.author.id)} className="rounded-full border border-white/60 px-2 py-1 text-[10px] font-semibold">{currentUser.following?.includes(current.author.id) ? <UserCheck size={13}/> : <UserPlus size={13}/>} {currentUser.following?.includes(current.author.id) ? 'Following' : 'Follow'}</button>}</div>
          {current.content && <p className="line-clamp-3 text-xs leading-5">{current.content}</p>}
          {!!current.tags?.length && <p className="mt-1 text-[10px] text-white/80">{current.tags.map(t=>t.startsWith('#')?t:`#${t}`).join(' ')}</p>}
          <p className="mt-2 text-[10px] text-white/65">{activeIndex + 1} / {filtered.length}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-3 pb-1">
          <button onClick={() => toggleLikePost(current.id)} className="flex flex-col items-center gap-0.5"><Heart size={22}/><span className="text-[10px]">{current.likesCount}</span></button>
          <button onClick={() => setCommentOpen(v => !v)} aria-label="Open video comments" aria-expanded={commentOpen} className="flex flex-col items-center gap-0.5"><MessageCircle size={22}/><span className="text-[10px]">{current.commentsCount}</span></button>
          <button onClick={() => setReshareModalPost(current)} aria-label="Reshare"><Repeat2 size={21}/></button>
          <button onClick={() => toggleSavePost(current.id)} aria-label="Save video"><Bookmark size={20}/></button>
          <button onClick={shareVideo} aria-label="Share video"><Share2 size={20}/></button>
          <button onClick={() => setMuted(v => !v)} aria-label={muted?'Unmute':'Mute'}>{muted?<VolumeX size={19}/>:<Volume2 size={19}/>}</button>
        </div>
      </div>
    </div>}

    <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
      <button onClick={previousVideo} disabled={activeIndex===0} aria-label="Previous video" className="grid h-8 w-8 place-items-center rounded-full bg-black/35 disabled:opacity-30"><ChevronUp size={18}/></button>
      <button onClick={nextVideo} disabled={activeIndex>=filtered.length-1} aria-label="Next video" className="grid h-8 w-8 place-items-center rounded-full bg-black/35 disabled:opacity-30"><ChevronDown size={18}/></button>
    </div>

    {commentOpen && current && <div ref={commentPanelRef} tabIndex={-1} className="fixed inset-x-0 bottom-14 z-[60] max-h-[72dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-slate-200 bg-white p-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl outline-none dark:border-slate-700 dark:bg-[#17131A] dark:text-white lg:absolute lg:bottom-3 lg:inset-x-3 lg:max-h-[72%] lg:rounded-2xl">
      <div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold">Comments · {current.commentsCount}</p><button onClick={() => setCommentOpen(false)} aria-label="Close comments"><X size={18}/></button></div>
      <div className="max-h-40 overflow-y-auto text-xs text-slate-500 dark:text-slate-400">{(comments[current.id] || []).length ? (comments[current.id] || []).map((c:any) => <div key={c.id} className="border-b border-slate-100 py-2 dark:border-slate-800"><span className="font-semibold text-slate-800 dark:text-slate-200">{c.author?.name || c.userName || 'Member'}</span><p className="mt-1">{c.content || c.text || ''}</p></div>) : <p className="py-5 text-center">Be the first to comment.</p>}</div>
      <form onSubmit={submitComment} className="mt-2 flex items-center gap-2"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment…" className="min-w-0 flex-1 rounded-full bg-slate-100 px-3 py-2 text-xs outline-none dark:bg-slate-800" /><button type="submit" disabled={!commentText.trim() || commentSubmitting} className="grid h-8 w-8 place-items-center rounded-full bg-[#E91E8C] text-white disabled:opacity-40" aria-label={commentSubmitting ? 'Posting comment' : 'Post comment'}><Send size={14}/></button></form>
    </div>}
  </section>;
};
