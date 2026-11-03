import React, { useMemo, useState } from 'react';
import { Search, Compass, Users, TrendingUp, Play, Heart, MessageCircle, Repeat2, Bookmark, Share2, PlusCircle, Film } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

const isVideoSource = (src: string) => /^data:video\//i.test(src) || /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(src) || /video/i.test(src);
type FeedMode = 'discover' | 'circle' | 'following' | 'trending';

export const ExploreView: React.FC = () => {
  const { posts, currentUser, toggleFollowUser, openUserProfile, setCreatePostModalOpen, toggleLikePost, toggleSavePost, setReshareModalPost, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FeedMode>('discover');
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('roseone_video_auto_next') !== 'false');
  const [activeIndex, setActiveIndex] = useState(0);
  const query = searchQuery.trim().toLowerCase();
  const videoPosts = useMemo(() => posts.filter(p => (p.media || []).some(isVideoSource)), [posts]);
  const filtered = useMemo(() => videoPosts.filter(p => {
    if (activeTab === 'circle' && !currentUser.following?.includes(p.author.id) && p.author.id !== currentUser.id) return false;
    if (activeTab === 'following' && !currentUser.following?.includes(p.author.id)) return false;
    if (query && ![p.content, p.author?.name, p.author?.handle, ...(p.tags || [])].some(v => String(v || '').toLowerCase().includes(query))) return false;
    return true;
  }).sort((a,b) => activeTab === 'trending' ? (b.viewsCount + b.likesCount * 3 + b.commentsCount * 2) - (a.viewsCount + a.likesCount * 3 + a.commentsCount * 2) : b.createdTimestamp-a.createdTimestamp), [videoPosts, activeTab, currentUser, query]);
  const current = filtered[Math.min(activeIndex, Math.max(0, filtered.length - 1))];
  const setAutoNextAndSave = (value: boolean) => { setAutoNext(value); localStorage.setItem('roseone_video_auto_next', String(value)); showToast('Video playback preference saved on this device.', 'success'); };
  const nextVideo = () => setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
  const previousVideo = () => setActiveIndex(i => Math.max(i - 1, 0));
  const switchTab = (tab: FeedMode) => { setActiveTab(tab); setActiveIndex(0); };

  return <div className="pb-8 space-y-4">
    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17131A] p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#E91E8C]">Gistupp Explore</p><h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Videos worth your time</h1><p className="text-xs text-slate-500 mt-1">Discover real videos shared by Gistupp members.</p></div>
        <button onClick={() => setCreatePostModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#E91E8C] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#BE185D]"><PlusCircle size={16}/> Create a post</button>
      </div>
      <div className="relative mt-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/><input value={searchQuery} onChange={e => {setSearchQuery(e.target.value);setActiveIndex(0)}} placeholder="Search videos, creators or hashtags" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]"/></div>
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">{([{id:'discover',label:'Discover',icon:Compass},{id:'circle',label:'Circle',icon:Users},{id:'following',label:'Following',icon:Users},{id:'trending',label:'Trending',icon:TrendingUp}] as const).map(t => <button key={t.id} onClick={() => switchTab(t.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${activeTab===t.id?'bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/25 dark:text-pink-200':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><t.icon size={15}/>{t.label}</button>)}</div>
    </section>
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4 items-start">
      <div className="min-w-0">
        {!current ? <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] px-6 py-16 text-center"><Film className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600"/><h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No videos to show yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">When members publish videos, they will appear here. You can create a post to share your own video—no sample videos are added.</p><button onClick={() => setCreatePostModalOpen(true)} className="mt-5 rounded-xl bg-[#E91E8C] px-4 py-2.5 text-sm font-bold text-white">Share a video</button></div> : <article className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-black shadow-lg">
          <div className="relative mx-auto flex min-h-[60vh] max-h-[82vh] max-w-[620px] items-center justify-center bg-black">
            {(() => { const source = (current.media || []).find(isVideoSource); return source ? <video key={current.id + source} src={source} controls playsInline autoPlay className="max-h-[82vh] w-full object-contain" onEnded={() => {if(autoNext) nextVideo()}} onError={() => showToast('This video could not be played in this browser.', 'error')} /> : null; })()}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-4 pt-16 text-white pointer-events-none"><button className="pointer-events-auto flex items-center gap-2 text-left" onClick={() => openUserProfile(current.author)}><Avatar src={current.author.avatar} name={current.author.name} size="sm"/><span className="font-bold text-sm">@{current.author.handle}</span></button><p className="mt-2 text-sm whitespace-pre-wrap break-words">{current.content}</p>{current.tags?.length ? <p className="mt-1 text-xs text-pink-200">{current.tags.map(t=>t.startsWith('#')?t:`#${t}`).join(' ')}</p>:null}</div>
            <div className="absolute right-3 bottom-24 flex flex-col gap-4 text-white"><button onClick={() => toggleLikePost(current.id)} className="flex flex-col items-center gap-1 drop-shadow"><Heart size={25}/><span className="text-[11px]">{current.likesCount}</span></button><button onClick={() => showToast('Open the post to view and reply to comments.', 'info')} className="flex flex-col items-center gap-1 drop-shadow"><MessageCircle size={25}/><span className="text-[11px]">{current.commentsCount}</span></button><button onClick={() => setReshareModalPost(current)} className="drop-shadow"><Repeat2 size={25}/></button><button onClick={() => toggleSavePost(current.id)} className="drop-shadow"><Bookmark size={23}/></button><button onClick={() => {navigator.clipboard?.writeText(`${location.origin}/post/${current.id}`);showToast('Video link copied when clipboard access is available.', 'success')}} className="drop-shadow"><Share2 size={23}/></button></div>
          </div>
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 dark:bg-[#17131A]"><div className="text-xs text-slate-500">Video {filtered.length ? activeIndex+1 : 0} of {filtered.length}</div><div className="flex gap-2"><button disabled={activeIndex===0} onClick={previousVideo} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">Previous</button><button disabled={activeIndex>=filtered.length-1} onClick={nextVideo} className="rounded-lg bg-[#E91E8C] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Next video</button></div></div>
        </article>}
      </div>
      <aside className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17131A] p-4 space-y-4"><div><h2 className="font-bold text-slate-900 dark:text-white">Playback controls</h2><p className="mt-1 text-xs leading-5 text-slate-500">Choose how Explore moves between videos.</p></div><label className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3"><span><span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Auto-play next</span><span className="mt-1 block text-xs text-slate-500">Move to the next video when the current one ends.</span></span><input type="checkbox" checked={autoNext} onChange={e=>setAutoNextAndSave(e.target.checked)} className="mt-1 accent-[#E91E8C]"/></label><div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Manual navigation</p><p className="mt-1 text-xs leading-5 text-slate-500">Previous and Next remain available, so you can always move videos yourself.</p></div><div className="rounded-xl bg-pink-50 dark:bg-pink-950/20 p-3"><p className="text-xs font-semibold text-[#BE185D] dark:text-pink-200">Video upload limit</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Gistupp's intended maximum is 30 minutes per video. Server-side upload enforcement and media storage still need production verification.</p></div></aside>
    </section>
  </div>;
};
