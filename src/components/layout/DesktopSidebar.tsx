import React from 'react';
import {
  Home, Compass, Radio, MessageCircle, ShoppingBag, Bell,
  Users, BriefcaseBusiness, Bookmark, Settings, Sparkles,
  ShieldAlert, PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const DesktopSidebar: React.FC = () => {
  const {
    activeTab, setActiveTab, activeView, setActiveView, currentUser,
    conversations, setNotificationsModalOpen, setAiAssistantModalOpen,
    setModerationModalOpen, setCreatePostModalOpen,
  } = useApp();

  const unread = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);

  const items = [
    { id: 'home', label: 'Home Feed', icon: <Home className="h-5 w-5" />, active: activeView === 'feed' && activeTab === 'home', action: () => { setActiveView('feed'); setActiveTab('home'); } },
    { id: 'explore', label: 'Explore', icon: <Compass className="h-5 w-5" />, active: activeView === 'feed' && activeTab === 'explore', action: () => { setActiveView('feed'); setActiveTab('explore'); } },
    { id: 'live', label: 'Live', icon: <Radio className="h-5 w-5" />, active: activeView === 'feed' && activeTab === 'live', action: () => { setActiveView('feed'); setActiveTab('live'); } },
    { id: 'messages', label: 'Messages', icon: <MessageCircle className="h-5 w-5" />, active: activeView === 'feed' && activeTab === 'messages', action: () => { setActiveView('feed'); setActiveTab('messages'); }, count: unread },
    { id: 'market', label: 'Marketplace', icon: <ShoppingBag className="h-5 w-5" />, active: activeView === 'feed' && activeTab === 'market', action: () => { setActiveView('feed'); setActiveTab('market'); } },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, active: false, action: () => setNotificationsModalOpen(true) },
    { id: 'communities', label: 'Communities', icon: <Users className="h-5 w-5" />, active: activeView === 'communities', action: () => setActiveView('communities') },
    { id: 'creator-hub', label: 'Creator Hub', icon: <BriefcaseBusiness className="h-5 w-5" />, active: activeView === 'creator-hub', action: () => setActiveView('creator-hub') },
    { id: 'saved', label: 'Saved Posts', icon: <Bookmark className="h-5 w-5" />, active: activeView === 'saved', action: () => setActiveView('saved') },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, active: activeView === 'settings', action: () => setActiveView('settings') },
    { id: 'ai', label: 'Gistupp AI', icon: <Sparkles className="h-5 w-5" />, active: false, action: () => setAiAssistantModalOpen(true) },
    { id: 'safety', label: 'Safety Center', icon: <ShieldAlert className="h-5 w-5" />, active: false, action: () => setModerationModalOpen(true) },
    { id: 'new-post', label: 'New Post', icon: <PlusCircle className="h-5 w-5" />, active: false, action: () => setCreatePostModalOpen(true) },
  ];

  return (
    <aside className="sticky top-16 flex h-[calc(100vh-4rem)] w-56 shrink-0 flex-col justify-between overflow-y-auto py-2 pr-1">
      <nav aria-label="Desktop navigation" className="space-y-1 pb-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            aria-current={item.active ? 'page' : undefined}
            style={item.active ? { backgroundColor: 'var(--brand-accent-soft)', color: 'var(--brand-accent-dark)' } : undefined}
            className={'flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ' + (item.active ? 'shadow-xs' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60')}
          >
            <span style={item.active ? { color: 'var(--brand-accent)' } : undefined}>{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {!!item.count && <span className="rounded-full bg-[#E91E8C] px-1.5 py-0.5 text-[10px] font-bold text-white">{item.count}</span>}
          </button>
        ))}
      </nav>
      <button
        onClick={() => { setActiveView('feed'); setActiveTab('profile'); }}
        className="sticky bottom-0 flex w-full items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/95 p-2 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-[#17131A]/95 dark:hover:bg-slate-800/60"
      >
        <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
          <span className="block truncate text-[11px] text-slate-400">@{currentUser.handle}</span>
        </span>
      </button>
    </aside>
  );
};
