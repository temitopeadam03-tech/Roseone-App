import React from 'react';
import { Home, Compass, PlusCircle, MessageCircle, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AndroidTab } from '../../types';

export const AndroidBottomTabs: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setActiveView,
    setCreatePostModalOpen,
    conversations,
  } = useApp();

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const tabs: { id: AndroidTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: 'create',
      label: 'Create',
      icon: (
        <div
          style={{
            background: 'linear-gradient(135deg, var(--brand-accent-dark, #BE185D), var(--brand-accent, #E91E8C))',
            boxShadow: '0 4px 14px var(--brand-accent-ring, rgba(233, 30, 140, 0.35))',
          }}
          className="w-10 h-10 rounded-full text-white flex items-center justify-center -mt-2 transition-transform hover:scale-105"
        >
          <PlusCircle className="w-6 h-6" />
        </div>
      ),
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: (
        <div className="relative">
          <MessageCircle className="w-5 h-5" />
          {totalUnreadMessages > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[#E91E8C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#17131A]">
              {totalUnreadMessages}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'market',
      label: 'Market',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
  ];

  const handleTabClick = (tabId: AndroidTab) => {
    if (tabId === 'create') {
      setCreatePostModalOpen(true);
      return;
    }
    setActiveTab(tabId);
    setActiveView('feed');
  };

  return (
    <nav
      aria-label="RoseOne Android Bottom Navigation"
      className="grid grid-cols-5 items-center h-14 bg-white/95 dark:bg-[#17131A]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 select-none z-30 shrink-0"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={isActive ? { color: 'var(--brand-accent)' } : undefined}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              isActive
                ? 'text-[#E91E8C] font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.id !== 'create' && (
              <span className="text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
