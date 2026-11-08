import React from 'react';
import { Home, Compass, MessageCircle, ShoppingBag, Radio } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const DesktopSidebar: React.FC = () => {
  const { activeTab, setActiveTab, activeView, setActiveView, currentUser, conversations } = useApp();
  const unread = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
  const items = [
    { id: 'home' as const, label: 'Home', icon: <Home className="h-5 w-5" /> },
    { id: 'explore' as const, label: 'Explore', icon: <Compass className="h-5 w-5" /> },
    { id: 'live' as const, label: 'Live', icon: <Radio className="h-5 w-5" /> },
    { id: 'messages' as const, label: 'Messages', icon: <MessageCircle className="h-5 w-5" /> },
    { id: 'market' as const, label: 'Market', icon: <ShoppingBag className="h-5 w-5" /> },
  ];
  return (
    <aside className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col justify-between overflow-y-auto py-4 pr-2">
      <nav aria-label="Main navigation" className="space-y-1">
        {items.map((item) => {
          const active = activeView === 'feed' && activeTab === item.id;
          return (
            <button key={item.id} onClick={() => { setActiveView('feed'); setActiveTab(item.id); }}
              aria-current={active ? 'page' : undefined}
              style={active ? { backgroundColor: 'var(--brand-accent-soft)', color: 'var(--brand-accent-dark)' } : undefined}
              className={'flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ' + (active ? 'shadow-xs' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60')}>
              <span style={active ? { color: 'var(--brand-accent)' } : undefined}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'messages' && unread > 0 && <span className="ml-auto rounded-full bg-[#E91E8C] px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
            </button>
          );
        })}
      </nav>
      <button onClick={() => { setActiveView('feed'); setActiveTab('profile'); }}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200/70 p-2.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/60">
        <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
          <span className="block truncate text-[11px] text-slate-400">@{currentUser.handle}</span>
        </span>
      </button>
    </aside>
  );
};
