import React from 'react';
import {
  Users,
  Video,
  Sparkles,
  Briefcase,
  Bookmark,
  Calendar,
  Wallet,
  Settings,
  HelpCircle,
  Flag,
  Info,
  LogOut,
  X,
  ChevronRight,
  ShieldAlert,
  User as UserIcon,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { RoseOneLogo } from '../ui/RoseOneLogo';

export const AndroidDrawerMenu: React.FC = () => {
  const {
    isAndroidDrawerOpen,
    setIsAndroidDrawerOpen,
    currentUser,
    setActiveView,
    setActiveTab,
    setAiAssistantModalOpen,
    pushSettingsSection,
    showToast,
    setModerationModalOpen,
    setIsAuthModalOpen,
    logout,
  } = useApp();

  if (!isAndroidDrawerOpen) return null;

  const navigateTo = (action: () => void) => {
    setIsAndroidDrawerOpen(false);
    action();
  };

  const menuSections = [
    {
      title: 'Navigation & Hubs',
      items: [
        {
          id: 'profile',
          label: 'My Profile',
          icon: <UserIcon className="w-5 h-5 text-[#E91E8C]" />,
          action: () => {
            setActiveView('feed');
            setActiveTab('profile');
          },
        },
        {
          id: 'marketplace',
          label: 'Marketplace & Shop',
          icon: <ShoppingBag className="w-5 h-5 text-[#BE185D]" />,
          action: () => {
            setActiveView('feed');
            setActiveTab('market');
          },
        },
        {
          id: 'communities',
          label: 'Communities & Groups',
          icon: <Users className="w-5 h-5 text-[#E91E8C]" />,
          action: () => {
            setActiveView('communities');
          },
        },
        {
          id: 'reels',
          label: 'Videos & Clips',
          icon: <Video className="w-5 h-5 text-[#E91E8C]" />,
          action: () => {
            setActiveView('reels');
          },
        },
        {
          id: 'ai-assistant',
          label: 'Rose AI Assistant',
          icon: <Sparkles className="w-5 h-5 text-amber-500" />,
          action: () => {
            setAiAssistantModalOpen(true);
          },
        },
        {
          id: 'business',
          label: 'Creator Hub & Store',
          icon: <Briefcase className="w-5 h-5 text-[#BE185D]" />,
          action: () => {
            setActiveView('creator-hub');
          },
        },
        {
          id: 'saved',
          label: 'Saved Posts',
          icon: <Bookmark className="w-5 h-5 text-[#E91E8C]" />,
          action: () => {
            setActiveView('saved');
          },
        },
        {
          id: 'events',
          label: 'Community Events',
          icon: <Calendar className="w-5 h-5 text-indigo-500" />,
          action: () => {
            setActiveView('communities');
            showToast('Opening community channels & events', 'info');
          },
        },
        {
          id: 'wallet',
          label: 'Creator Earnings',
          icon: <Wallet className="w-5 h-5 text-emerald-500" />,
          action: () => {
            setActiveView('creator-hub');
          },
        },
      ],
    },
    {
      title: 'Preferences & Safety',
      items: [
        {
          id: 'settings',
          label: 'Android Settings',
          icon: <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
          action: () => {
            setActiveView('settings');
            pushSettingsSection('overview');
          },
        },
        {
          id: 'moderation',
          label: 'Safety Center',
          icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
          action: () => {
            setModerationModalOpen(true);
          },
        },
        {
          id: 'help',
          label: 'Help & Support',
          icon: <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
          action: () => {
            setActiveView('settings');
            pushSettingsSection('help-legal');
          },
        },
        {
          id: 'report',
          label: 'Report a Problem',
          icon: <Flag className="w-5 h-5 text-amber-600" />,
          action: () => {
            setActiveView('settings');
            pushSettingsSection('help-legal');
            showToast('Support ticket dialog ready under Help & Legal', 'info');
          },
        },
        {
          id: 'about',
          label: 'About RoseOne',
          icon: <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
          action: () => {
            setActiveView('settings');
            pushSettingsSection('help-legal');
          },
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={() => setIsAndroidDrawerOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Body */}
      <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-[#17131A] shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-[#FCE7F3]/40 to-transparent dark:from-[#BE185D]/10">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() =>
                navigateTo(() => {
                  setActiveView('feed');
                  setActiveTab('profile');
                })
              }
              className="hover:opacity-90 transition-opacity"
              title="View my profile"
            >
              <Avatar src={currentUser.avatar} name={currentUser.name} size="lg" />
            </button>
            <button
              onClick={() => setIsAndroidDrawerOpen(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() =>
              navigateTo(() => {
                setActiveView('feed');
                setActiveTab('profile');
              })
            }
            className="text-left w-full group"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-[#E91E8C] transition-colors">
              {currentUser.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{currentUser.handle}</p>
          </button>
          <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-600 dark:text-slate-300">
            <span>
              <strong className="font-semibold text-slate-900 dark:text-white">
                {currentUser.followingCount}
              </strong>{' '}
              Following
            </span>
            <span>
              <strong className="font-semibold text-slate-900 dark:text-white">
                {currentUser.followersCount}
              </strong>{' '}
              Followers
            </span>
          </div>

          {/* Authenticated user badge */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected Member
            </span>
            <span className="text-[11px] font-semibold text-[#E91E8C]">
              {currentUser.joinedDate || 'Verified'}
            </span>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {menuSections.map((sec) => (
            <div key={sec.title}>
              <h3 className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                {sec.title}
              </h3>
              <div className="space-y-0.5">
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.action)}
                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={() => {
              setIsAndroidDrawerOpen(false);
              setIsAuthModalOpen(true);
            }}
            className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-semibold text-[#E91E8C] hover:bg-[#FCE7F3] dark:hover:bg-[#BE185D]/20 rounded-xl transition-colors"
          >
            <UserIcon className="w-5 h-5 text-[#E91E8C]" />
            <span>Switch / Sign In</span>
          </button>
          <button
            onClick={() => {
              setIsAndroidDrawerOpen(false);
              logout();
            }}
            className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
          <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-100 dark:border-slate-800/60">
            <RoseOneLogo variant="compact" size="xs" />
            <span className="text-[10px] font-mono text-slate-400">v2.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
