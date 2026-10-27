import React from 'react';
import {
  Home,
  Compass,
  MessageCircle,
  Bell,
  Users,
  Briefcase,
  Bookmark,
  Settings,
  Sparkles,
  ShieldAlert,
  PlusCircle,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const DesktopSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeView,
    setActiveView,
    setCreatePostModalOpen,
    setAiAssistantModalOpen,
    setModerationModalOpen,
    setNotificationsModalOpen,
    unreadNotificationsCount,
    currentUser,
    conversations,
  } = useApp();

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const navItems = [
    {
      id: 'feed',
      label: 'Home Feed',
      icon: <Home className="w-5 h-5" />,
      action: () => {
        setActiveView('feed');
        setActiveTab('home');
      },
      isActive: activeView === 'feed' && activeTab === 'home',
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: <Compass className="w-5 h-5" />,
      action: () => {
        setActiveView('feed');
        setActiveTab('explore');
      },
      isActive: activeTab === 'explore',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageCircle className="w-5 h-5" />,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
      action: () => {
        setActiveView('feed');
        setActiveTab('messages');
      },
      isActive: activeTab === 'messages',
    },
    {
      id: 'market',
      label: 'Marketplace',
      icon: <ShoppingBag className="w-5 h-5" />,
      action: () => {
        setActiveView('feed');
        setActiveTab('market');
      },
      isActive: activeTab === 'market',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      action: () => {
        setNotificationsModalOpen(true);
      },
      isActive: false,
    },
    {
      id: 'communities',
      label: 'Communities',
      icon: <Users className="w-5 h-5" />,
      action: () => {
        setActiveView('communities');
      },
      isActive: activeView === 'communities',
    },
    {
      id: 'creator-hub',
      label: 'Creator Hub',
      icon: <Briefcase className="w-5 h-5" />,
      action: () => {
        setActiveView('creator-hub');
      },
      isActive: activeView === 'creator-hub',
    },
    {
      id: 'saved',
      label: 'Saved Posts',
      icon: <Bookmark className="w-5 h-5" />,
      action: () => {
        setActiveView('saved');
      },
      isActive: activeView === 'saved',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      action: () => {
        setActiveView('settings');
      },
      isActive: activeView === 'settings',
    },
    {
      id: 'ai-assistant',
      label: 'RoseOne AI',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      action: () => {
        setAiAssistantModalOpen(true);
      },
      isActive: false,
    },
    {
      id: 'moderation',
      label: 'Safety Center',
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      action: () => {
        setModerationModalOpen(true);
      },
      isActive: false,
    },
  ];

  return (
    <aside className="w-60 xl:w-64 sticky top-14 h-[calc(100vh-3.5rem)] flex flex-col justify-between py-4 pr-2 shrink-0 select-none overflow-y-auto no-scrollbar">
      <div className="space-y-4">
        {/* Navigation list */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              style={
                item.isActive
                  ? {
                      backgroundColor: 'var(--brand-accent-soft)',
                      color: 'var(--brand-accent-dark)',
                    }
                  : undefined
              }
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                item.isActive
                  ? 'shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span style={item.isActive ? { color: 'var(--brand-accent)' } : undefined}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{ backgroundColor: 'var(--brand-accent)' }}
                  className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Big Create Post Button */}
        <button
          onClick={() => setCreatePostModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, var(--brand-accent-dark, #BE185D), var(--brand-accent, #E91E8C))',
            boxShadow: '0 4px 14px var(--brand-accent-ring, rgba(233, 30, 140, 0.25))',
          }}
          className="w-full min-h-[44px] py-3 px-4 rounded-2xl hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Post</span>
        </button>
      </div>

      {/* User profile snippet */}
      <button
        onClick={() => {
          setActiveView('feed');
          setActiveTab('profile');
        }}
        className="w-full p-2.5 rounded-2xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left border border-slate-200/60 dark:border-slate-800"
      >
        <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
            {currentUser.name}
          </span>
          <p className="text-[11px] text-slate-400 truncate">@{currentUser.handle}</p>
        </div>
      </button>
    </aside>
  );
};
